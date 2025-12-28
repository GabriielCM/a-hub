import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventReportQueryDto } from './dto';
import { Prisma } from '@prisma/client';

export interface UserCheckinStats {
  userId: string;
  userName: string;
  userEmail: string;
  checkinCount: number;
  totalPoints: number;
  firstCheckin: Date;
  lastCheckin: Date;
}

@Injectable()
export class EventsReportService {
  constructor(private prisma: PrismaService) {}

  async getEventReport(eventId: string, query: EventReportQueryDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startAt: true,
        endAt: true,
        totalPoints: true,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento nao encontrado');
    }

    // Build where clause for checkins
    const where: Prisma.EventCheckinWhereInput = { eventId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    // Get all checkins
    const checkins = await this.prisma.eventCheckin.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate by user
    const userStatsMap = new Map<string, UserCheckinStats>();

    for (const checkin of checkins) {
      const existing = userStatsMap.get(checkin.userId);

      if (existing) {
        existing.checkinCount++;
        existing.totalPoints += checkin.pointsAwarded;
        if (checkin.createdAt < existing.firstCheckin) {
          existing.firstCheckin = checkin.createdAt;
        }
        if (checkin.createdAt > existing.lastCheckin) {
          existing.lastCheckin = checkin.createdAt;
        }
      } else {
        userStatsMap.set(checkin.userId, {
          userId: checkin.userId,
          userName: checkin.user.name,
          userEmail: checkin.user.email,
          checkinCount: 1,
          totalPoints: checkin.pointsAwarded,
          firstCheckin: checkin.createdAt,
          lastCheckin: checkin.createdAt,
        });
      }
    }

    const userStats = Array.from(userStatsMap.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints,
    );

    const totalPointsDistributed = checkins.reduce(
      (sum, c) => sum + c.pointsAwarded,
      0,
    );

    return {
      event,
      totalCheckins: checkins.length,
      uniqueUsers: userStats.length,
      totalPointsDistributed,
      checkins: checkins.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userEmail: c.user.email,
        checkinNumber: c.checkinNumber,
        pointsAwarded: c.pointsAwarded,
        createdAt: c.createdAt,
      })),
      userStats,
    };
  }

  async exportCsv(eventId: string, query: EventReportQueryDto): Promise<string> {
    const report = await this.getEventReport(eventId, query);

    const headers = [
      'Data/Hora',
      'Usuario',
      'Email',
      'Check-in #',
      'Pontos',
    ];

    const rows = report.checkins.map((c) => [
      new Date(c.createdAt).toLocaleString('pt-BR'),
      c.userName,
      c.userEmail,
      c.checkinNumber.toString(),
      c.pointsAwarded.toString(),
    ]);

    // Add summary rows
    const summaryRows = [
      [],
      ['RESUMO'],
      ['Total de Check-ins', report.totalCheckins.toString()],
      ['Usuarios Unicos', report.uniqueUsers.toString()],
      ['Pontos Distribuidos', report.totalPointsDistributed.toString()],
      [],
      ['RANKING POR USUARIO'],
      ['Usuario', 'Email', 'Check-ins', 'Pontos', 'Primeiro', 'Ultimo'],
      ...report.userStats.map((u) => [
        u.userName,
        u.userEmail,
        u.checkinCount.toString(),
        u.totalPoints.toString(),
        new Date(u.firstCheckin).toLocaleString('pt-BR'),
        new Date(u.lastCheckin).toLocaleString('pt-BR'),
      ]),
    ];

    const allRows = [
      [`Relatorio: ${report.event.name}`],
      [
        `Periodo: ${new Date(report.event.startAt).toLocaleString('pt-BR')} - ${new Date(report.event.endAt).toLocaleString('pt-BR')}`,
      ],
      [],
      headers,
      ...rows,
      ...summaryRows,
    ];

    return allRows
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell.replace(/"/g, '""')}"`
              : cell,
          )
          .join(','),
      )
      .join('\n');
  }

  async getEventsSummary(query: EventReportQueryDto) {
    const where: Prisma.EventWhereInput = {};

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

    const events = await this.prisma.event.findMany({
      where,
      include: {
        _count: {
          select: { checkins: true },
        },
        checkins: {
          select: { pointsAwarded: true },
        },
      },
      orderBy: { startAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      startAt: event.startAt,
      endAt: event.endAt,
      status: event.status,
      totalPoints: event.totalPoints,
      checkinCount: event._count.checkins,
      pointsDistributed: event.checkins.reduce(
        (sum, c) => sum + c.pointsAwarded,
        0,
      ),
    }));
  }
}
