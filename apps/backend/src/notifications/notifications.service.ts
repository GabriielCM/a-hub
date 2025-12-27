import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import * as webpush from 'web-push';

export type NotificationType =
  | 'POINTS_RECEIVED'
  | 'POST_LIKED'
  | 'POST_COMMENTED';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data: {
    url: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private isConfigured = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeVapid();
  }

  private initializeVapid() {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:admin@cristofoli.com.br';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.isConfigured = true;
      this.logger.log('VAPID configured successfully');
    } else {
      this.logger.warn(
        'VAPID keys not configured. Push notifications disabled.',
      );
    }
  }

  /**
   * Get VAPID public key for frontend subscription
   */
  getVapidPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: string, dto: SubscribePushDto) {
    const { endpoint, p256dh, auth } = dto;

    // Upsert subscription (same endpoint = update keys)
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    });
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Unsubscribe all subscriptions for a user
   */
  async unsubscribeAll(userId: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: NotificationPayload) {
    if (!this.isConfigured) {
      this.logger.debug('Push notifications not configured, skipping');
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No subscriptions found for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      data: payload.data,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload,
        );
        this.logger.debug(`Notification sent to ${sub.endpoint}`);
      } catch (error: any) {
        // If subscription is invalid (410 Gone or 404), remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.logger.log(`Removing invalid subscription: ${sub.endpoint}`);
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          this.logger.error(`Failed to send notification: ${error.message}`);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  }

  // ===== Notification Trigger Methods =====

  /**
   * Notify user of received points transfer
   */
  async notifyPointsReceived(
    recipientUserId: string,
    senderName: string,
    amount: number,
  ) {
    await this.sendToUser(recipientUserId, {
      type: 'POINTS_RECEIVED',
      title: 'Pontos Recebidos!',
      body: `${senderName} transferiu ${amount} pontos para voce.`,
      data: {
        url: '/dashboard/pontos',
        amount,
        senderName,
      },
    });
  }

  /**
   * Notify post author of a like
   */
  async notifyPostLiked(
    authorUserId: string,
    likerName: string,
    postId: string,
  ) {
    await this.sendToUser(authorUserId, {
      type: 'POST_LIKED',
      title: 'Nova Curtida!',
      body: `${likerName} curtiu sua publicacao.`,
      data: {
        url: '/dashboard/feed',
        postId,
        likerName,
      },
    });
  }

  /**
   * Notify post author of a comment
   */
  async notifyPostCommented(
    authorUserId: string,
    commenterName: string,
    postId: string,
    commentPreview: string,
  ) {
    await this.sendToUser(authorUserId, {
      type: 'POST_COMMENTED',
      title: 'Novo Comentario!',
      body: `${commenterName}: ${commentPreview}`,
      data: {
        url: '/dashboard/feed',
        postId,
        commenterName,
      },
    });
  }
}
