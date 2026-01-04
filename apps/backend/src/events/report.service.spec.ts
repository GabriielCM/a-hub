import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsReportService', () => {
  let service: EventsReportService;
  let prisma: jest.Mocked<PrismaService>;

  const createMockEvent = (overrides = {}) => ({
    id: 'event-1',
    name: 'Test Event',
    startAt: new Date('2024-01-01T10:00:00Z'),
    endAt: new Date('2024-01-01T18:00:00Z'),
    totalPoints: 100,
    allowMultipleCheckins: false,
    maxCheckinsPerUser: null,
    status: EventStatus.ACTIVE,
    ...overrides,
  });

  const createMockCheckin = (overrides = {}) => ({
    id: 'checkin-1',
    eventId: 'event-1',
    userId: 'user-1',
    checkinNumber: 1,
    pointsAwarded: 100,
    createdAt: new Date(),
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
    },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsReportService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            eventCheckin: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsReportService>(EventsReportService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventReport', () => {
    it('should return event report with checkin statistics', async () => {
      const mockEvent = createMockEvent();
      const mockCheckins = [
        createMockCheckin({ userId: 'user-1', pointsAwarded: 100 }),
        createMockCheckin({ id: 'checkin-2', userId: 'user-2', pointsAwarded: 100, user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' } }),
        createMockCheckin({ id: 'checkin-3', userId: 'user-1', checkinNumber: 2, pointsAwarded: 50 }),
      ];

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue(mockCheckins);

      const result = await service.getEventReport('event-1', {});

      expect(result.event.id).toBe('event-1');
      expect(result.totalCheckins).toBe(3);
      expect(result.uniqueUsers).toBe(2);
      expect(result.totalPointsDistributed).toBe(250);
      expect(result.userStats).toHaveLength(2);
    });

    it('should throw NotFoundException if event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getEventReport('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter checkins by date range', async () => {
      const mockEvent = createMockEvent();
      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([]);

      await service.getEventReport('event-1', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(prisma.eventCheckin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventId: 'event-1',
            createdAt: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('exportCsv', () => {
    it('should generate CSV report', async () => {
      const mockEvent = createMockEvent();
      const mockCheckins = [
        createMockCheckin({ pointsAwarded: 100 }),
      ];

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue(mockCheckins);

      const csv = await service.exportCsv('event-1', {});

      expect(csv).toContain('Relatorio: Test Event');
      expect(csv).toContain('Data/Hora,Usuario,Email,Check-in #,Pontos');
      expect(csv).toContain('Test User');
      expect(csv).toContain('RESUMO');
      expect(csv).toContain('RANKING POR USUARIO');
    });

    it('should throw NotFoundException if event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.exportCsv('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEventsSummary', () => {
    it('should return summary of all events', async () => {
      const mockEvents = [
        {
          ...createMockEvent(),
          _count: { checkins: 5 },
          checkins: [{ pointsAwarded: 100 }, { pointsAwarded: 100 }],
        },
        {
          ...createMockEvent({ id: 'event-2', name: 'Event 2' }),
          _count: { checkins: 3 },
          checkins: [{ pointsAwarded: 50 }],
        },
      ];

      prisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsSummary({});

      expect(result).toHaveLength(2);
      expect(result[0].checkinCount).toBe(5);
      expect(result[0].pointsDistributed).toBe(200);
      expect(result[1].checkinCount).toBe(3);
      expect(result[1].pointsDistributed).toBe(50);
    });

    it('should filter events by date range', async () => {
      prisma.event.findMany.mockResolvedValue([]);

      await service.getEventsSummary({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: expect.any(Object),
          }),
        }),
      );
    });
  });
});
