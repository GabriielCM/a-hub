import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface QRPayloadData {
  event_id: string;
  sequence: number;
  expires_at: string;
  hmac: string;
}

export interface QRValidationResult {
  valid: boolean;
  eventId?: string;
  qrTokenId?: string;
  error?: string;
}

@Injectable()
export class QRService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate QR payload with HMAC signature
   */
  generatePayload(
    eventId: string,
    sequence: number,
    expiresAt: Date,
    secret: string,
  ): string {
    const data = {
      event_id: eventId,
      sequence: sequence,
      expires_at: expiresAt.toISOString(),
    };

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    return JSON.stringify({ ...data, hmac });
  }

  /**
   * Validate QR payload signature and expiration
   */
  async validatePayload(payload: string): Promise<QRValidationResult> {
    let parsed: QRPayloadData;

    try {
      parsed = JSON.parse(payload);
    } catch {
      return { valid: false, error: 'QR code invalido' };
    }

    const { event_id, sequence, expires_at, hmac } = parsed;

    if (!event_id || sequence === undefined || !expires_at || !hmac) {
      return { valid: false, error: 'QR code incompleto' };
    }

    // Fetch event to get the secret
    const event = await this.prisma.event.findUnique({
      where: { id: event_id },
    });

    if (!event) {
      return { valid: false, error: 'Evento nao encontrado' };
    }

    // Verify HMAC
    const dataToVerify = {
      event_id,
      sequence,
      expires_at,
    };

    const expectedHmac = crypto
      .createHmac('sha256', event.qrSecret)
      .update(JSON.stringify(dataToVerify))
      .digest('hex');

    if (hmac !== expectedHmac) {
      return { valid: false, error: 'QR code invalido' };
    }

    // Check expiration
    const expiresAtDate = new Date(expires_at);
    if (new Date() > expiresAtDate) {
      return { valid: false, error: 'QR code expirado' };
    }

    // Find the QR token in database
    const qrToken = await this.prisma.eventQRToken.findUnique({
      where: {
        eventId_sequence: {
          eventId: event_id,
          sequence,
        },
      },
    });

    if (!qrToken) {
      return { valid: false, error: 'QR code nao encontrado' };
    }

    return {
      valid: true,
      eventId: event_id,
      qrTokenId: qrToken.id,
    };
  }

  /**
   * Get or create current QR token based on time rotation
   */
  async getCurrentToken(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    const now = new Date();
    const rotationMs = event.qrRotationSeconds * 1000;

    // Calculate current sequence based on time
    const eventStartMs = event.startAt.getTime();
    const elapsedMs = now.getTime() - eventStartMs;
    const currentSequence = Math.max(0, Math.floor(elapsedMs / rotationMs));

    // Calculate expiration for this sequence
    const sequenceStartMs = eventStartMs + currentSequence * rotationMs;
    const expiresAt = new Date(sequenceStartMs + rotationMs);

    // Try to find existing token
    let qrToken = await this.prisma.eventQRToken.findUnique({
      where: {
        eventId_sequence: {
          eventId,
          sequence: currentSequence,
        },
      },
    });

    // Create if doesn't exist
    if (!qrToken) {
      const payload = this.generatePayload(
        eventId,
        currentSequence,
        expiresAt,
        event.qrSecret,
      );

      qrToken = await this.prisma.eventQRToken.create({
        data: {
          eventId,
          sequence: currentSequence,
          payload,
          expiresAt,
        },
      });
    }

    return qrToken;
  }

  /**
   * Get display data for an event (for TV display)
   */
  async getDisplayData(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { checkins: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('Evento nao esta ativo');
    }

    const now = new Date();

    // Se passou do periodo, encerrar evento automaticamente
    if (now > event.endAt) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.COMPLETED },
      });
      throw new BadRequestException('EVENTO_ENCERRADO');
    }

    // Se ainda nao comecou
    if (now < event.startAt) {
      throw new BadRequestException('EVENTO_NAO_INICIADO');
    }

    const currentToken = await this.getCurrentToken(eventId);

    // Calculate time until next rotation
    const rotationMs = event.qrRotationSeconds * 1000;
    const msUntilExpiry = currentToken.expiresAt.getTime() - now.getTime();
    const nextRotationIn = Math.max(0, Math.ceil(msUntilExpiry / 1000));

    // Get unique user count
    const uniqueUsers = await this.prisma.eventCheckin.groupBy({
      by: ['userId'],
      where: { eventId },
    });

    return {
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        startAt: event.startAt,
        endAt: event.endAt,
        totalPoints: event.totalPoints,
        allowMultipleCheckins: event.allowMultipleCheckins,
        maxCheckinsPerUser: event.maxCheckinsPerUser,
        displayBackgroundColor: event.displayBackgroundColor,
        displayLogo: event.displayLogo,
        displayLayout: event.displayLayout,
        qrRotationSeconds: event.qrRotationSeconds,
      },
      qrPayload: currentToken.payload,
      expiresAt: currentToken.expiresAt,
      nextRotationIn,
      stats: {
        totalCheckins: event._count.checkins,
        uniqueUsers: uniqueUsers.length,
      },
    };
  }
}
