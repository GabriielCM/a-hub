import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QRService } from './qr.service';
import { EventStatus, PointsTransactionType } from '@prisma/client';

export interface CheckinResult {
  success: boolean;
  checkinId: string;
  pointsAwarded: number;
  checkinNumber: number;
  checkinsRemaining: number;
  event: {
    id: string;
    name: string;
  };
}

@Injectable()
export class CheckinService {
  constructor(
    private prisma: PrismaService,
    private qrService: QRService,
  ) {}

  async processCheckin(userId: string, qrPayload: string): Promise<CheckinResult> {
    // 1. Validate QR payload
    const validation = await this.qrService.validatePayload(qrPayload);

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const { eventId, qrTokenId } = validation;

    if (!eventId || !qrTokenId) {
      throw new BadRequestException('QR code invalido');
    }

    // 2. Get event and validate it's active
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('Evento nao esta ativo');
    }

    const now = new Date();
    if (now < event.startAt || now > event.endAt) {
      throw new BadRequestException('Evento fora do periodo de check-in');
    }

    // 3. Check user's existing check-ins
    const existingCheckins = await this.prisma.eventCheckin.findMany({
      where: { eventId, userId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Validate check-in rules
    if (!event.allowMultipleCheckins && existingCheckins.length > 0) {
      throw new BadRequestException('Check-in ja realizado neste evento');
    }

    if (event.allowMultipleCheckins) {
      if (existingCheckins.length >= (event.maxCheckinsPerUser ?? 0)) {
        throw new BadRequestException('Limite de check-ins atingido');
      }

      // Check interval
      if (existingCheckins.length > 0 && event.checkinIntervalSeconds) {
        const lastCheckin = existingCheckins[0];
        const secondsSinceLast =
          (now.getTime() - lastCheckin.createdAt.getTime()) / 1000;

        if (secondsSinceLast < event.checkinIntervalSeconds) {
          const waitTime = Math.ceil(
            event.checkinIntervalSeconds - secondsSinceLast,
          );
          throw new BadRequestException(`Aguarde ${waitTime} segundos`);
        }
      }
    }

    // 5. Check if same QR token already used by this user
    const tokenUsed = existingCheckins.some((c) => c.qrTokenId === qrTokenId);
    if (tokenUsed) {
      throw new BadRequestException('Este QR code ja foi utilizado');
    }

    // 6. Calculate points
    const checkinNumber = existingCheckins.length + 1;
    const pointsToAward = this.calculatePoints(event, checkinNumber);

    // 7. Create check-in and award points in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create check-in record
      const checkin = await tx.eventCheckin.create({
        data: {
          eventId,
          userId,
          qrTokenId,
          checkinNumber,
          pointsAwarded: pointsToAward,
        },
      });

      // Get or create user's points balance
      let pointsBalance = await tx.pointsBalance.findUnique({
        where: { userId },
      });

      if (!pointsBalance) {
        pointsBalance = await tx.pointsBalance.create({
          data: { userId, balance: 0 },
        });
      }

      // Update balance
      await tx.pointsBalance.update({
        where: { id: pointsBalance.id },
        data: { balance: { increment: pointsToAward } },
      });

      // Create transaction record
      await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: pointsBalance.id,
          type: PointsTransactionType.EVENT_CHECKIN,
          amount: pointsToAward,
          description: `Check-in: ${event.name}`,
        },
      });

      return checkin;
    });

    // Calculate remaining check-ins
    const checkinsRemaining = event.allowMultipleCheckins
      ? (event.maxCheckinsPerUser ?? 0) - checkinNumber
      : 0;

    return {
      success: true,
      checkinId: result.id,
      pointsAwarded: pointsToAward,
      checkinNumber,
      checkinsRemaining,
      event: {
        id: event.id,
        name: event.name,
      },
    };
  }

  private calculatePoints(
    event: {
      totalPoints: number;
      allowMultipleCheckins: boolean;
      maxCheckinsPerUser: number | null;
    },
    checkinNumber: number,
  ): number {
    if (!event.allowMultipleCheckins) {
      return event.totalPoints;
    }

    const maxCheckins = event.maxCheckinsPerUser ?? 1;
    const basePoints = Math.floor(event.totalPoints / maxCheckins);
    const isLastCheckin = checkinNumber === maxCheckins;
    const remainder = event.totalPoints % maxCheckins;

    return isLastCheckin ? basePoints + remainder : basePoints;
  }

  async getUserCheckins(eventId: string, userId: string) {
    return this.prisma.eventCheckin.findMany({
      where: { eventId, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            totalPoints: true,
            allowMultipleCheckins: true,
            maxCheckinsPerUser: true,
          },
        },
      },
    });
  }

  async getEventCheckinStatus(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: true,
        checkinIntervalSeconds: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    const userCheckins = await this.prisma.eventCheckin.findMany({
      where: { eventId, userId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const isActive =
      event.status === EventStatus.ACTIVE &&
      now >= event.startAt &&
      now <= event.endAt;

    let canCheckin = isActive;
    let waitTimeSeconds = 0;

    if (canCheckin) {
      if (!event.allowMultipleCheckins && userCheckins.length > 0) {
        canCheckin = false;
      } else if (event.allowMultipleCheckins) {
        if (userCheckins.length >= (event.maxCheckinsPerUser ?? 0)) {
          canCheckin = false;
        } else if (userCheckins.length > 0 && event.checkinIntervalSeconds) {
          const lastCheckin = userCheckins[0];
          const secondsSinceLast =
            (now.getTime() - lastCheckin.createdAt.getTime()) / 1000;

          if (secondsSinceLast < event.checkinIntervalSeconds) {
            canCheckin = false;
            waitTimeSeconds = Math.ceil(
              event.checkinIntervalSeconds - secondsSinceLast,
            );
          }
        }
      }
    }

    const totalPointsEarned = userCheckins.reduce(
      (sum, c) => sum + c.pointsAwarded,
      0,
    );

    return {
      event: {
        id: event.id,
        name: event.name,
        totalPoints: event.totalPoints,
        allowMultipleCheckins: event.allowMultipleCheckins,
        maxCheckinsPerUser: event.maxCheckinsPerUser,
      },
      userCheckinCount: userCheckins.length,
      checkinsRemaining: event.allowMultipleCheckins
        ? (event.maxCheckinsPerUser ?? 0) - userCheckins.length
        : userCheckins.length > 0
          ? 0
          : 1,
      totalPointsEarned,
      canCheckin,
      waitTimeSeconds,
      lastCheckinAt: userCheckins[0]?.createdAt ?? null,
    };
  }
}
