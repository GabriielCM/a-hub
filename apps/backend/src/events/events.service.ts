import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto';
import { EventStatus, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventDto, createdById: string) {
    // Validate dates
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException(
        'Data de termino deve ser posterior a data de inicio',
      );
    }

    // Validate multiple checkins configuration
    if (dto.allowMultipleCheckins) {
      if (!dto.maxCheckinsPerUser) {
        throw new BadRequestException(
          'maxCheckinsPerUser e obrigatorio quando allowMultipleCheckins e true',
        );
      }
      if (!dto.checkinIntervalSeconds) {
        throw new BadRequestException(
          'checkinIntervalSeconds e obrigatorio quando allowMultipleCheckins e true',
        );
      }
    }

    return this.prisma.event.create({
      data: {
        name: dto.name,
        description: dto.description,
        startAt,
        endAt,
        totalPoints: dto.totalPoints,
        allowMultipleCheckins: dto.allowMultipleCheckins,
        maxCheckinsPerUser: dto.maxCheckinsPerUser,
        checkinIntervalSeconds: dto.checkinIntervalSeconds,
        displayBackgroundColor: dto.displayBackgroundColor,
        displayLogo: dto.displayLogo,
        displayLayout: dto.displayLayout,
        qrRotationSeconds: dto.qrRotationSeconds ?? 30,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { checkins: true },
        },
      },
    });
  }

  async findAll(query: EventQueryDto) {
    const where: Prisma.EventWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.startAt = {};
      if (query.startDate) {
        where.startAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setDate(end.getDate() + 1);
        where.startAt.lt = end;
      }
    }

    return this.prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { checkins: true },
        },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { checkins: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.findOne(id);

    // Validate dates if provided
    const startAt = dto.startAt ? new Date(dto.startAt) : event.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : event.endAt;

    if (endAt <= startAt) {
      throw new BadRequestException(
        'Data de termino deve ser posterior a data de inicio',
      );
    }

    // Validate multiple checkins configuration
    const allowMultiple =
      dto.allowMultipleCheckins ?? event.allowMultipleCheckins;
    if (allowMultiple) {
      const maxCheckins = dto.maxCheckinsPerUser ?? event.maxCheckinsPerUser;
      const interval =
        dto.checkinIntervalSeconds ?? event.checkinIntervalSeconds;
      if (!maxCheckins || !interval) {
        throw new BadRequestException(
          'maxCheckinsPerUser e checkinIntervalSeconds sao obrigatorios quando allowMultipleCheckins e true',
        );
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        totalPoints: dto.totalPoints,
        allowMultipleCheckins: dto.allowMultipleCheckins,
        maxCheckinsPerUser: dto.maxCheckinsPerUser,
        checkinIntervalSeconds: dto.checkinIntervalSeconds,
        displayBackgroundColor: dto.displayBackgroundColor,
        displayLogo: dto.displayLogo,
        displayLayout: dto.displayLayout,
        qrRotationSeconds: dto.qrRotationSeconds,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { checkins: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: EventStatus) {
    await this.findOne(id);

    return this.prisma.event.update({
      where: { id },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { checkins: true },
        },
      },
    });
  }

  async getAvailable() {
    const now = new Date();

    return this.prisma.event.findMany({
      where: {
        status: EventStatus.ACTIVE,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      select: {
        id: true,
        name: true,
        description: true,
        startAt: true,
        endAt: true,
        totalPoints: true,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: true,
        _count: {
          select: { checkins: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getUpcoming() {
    const now = new Date();

    return this.prisma.event.findMany({
      where: {
        status: EventStatus.ACTIVE,
        startAt: { gt: now },
      },
      select: {
        id: true,
        name: true,
        description: true,
        startAt: true,
        endAt: true,
        totalPoints: true,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getUserEvents(userId: string) {
    const now = new Date();

    // Get active events with user's checkin info
    const activeEvents = await this.prisma.event.findMany({
      where: {
        status: EventStatus.ACTIVE,
        endAt: { gte: now },
      },
      select: {
        id: true,
        name: true,
        description: true,
        startAt: true,
        endAt: true,
        totalPoints: true,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: true,
        checkins: {
          where: { userId },
          select: {
            id: true,
            checkinNumber: true,
            pointsAwarded: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return activeEvents.map((event) => ({
      ...event,
      userCheckinCount: event.checkins.length,
      canCheckin: this.canUserCheckin(event, event.checkins.length),
    }));
  }

  private canUserCheckin(
    event: { allowMultipleCheckins: boolean; maxCheckinsPerUser: number | null },
    checkinCount: number,
  ): boolean {
    if (!event.allowMultipleCheckins) {
      return checkinCount === 0;
    }
    return checkinCount < (event.maxCheckinsPerUser ?? 0);
  }
}
