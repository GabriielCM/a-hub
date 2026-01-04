import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { CheckinService } from './checkin.service';
import { QRService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockEvent,
  createMockEventWithMultipleCheckins,
  createMockCheckin,
} from '../../test/factories';

describe('CheckinService', () => {
  let service: CheckinService;
  let prisma: jest.Mocked<PrismaService>;
  let qrService: jest.Mocked<QRService>;

  const mockTransaction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
            },
            eventCheckin: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            pointsBalance: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            pointsTransaction: {
              create: jest.fn(),
            },
            $transaction: mockTransaction,
          },
        },
        {
          provide: QRService,
          useValue: {
            validatePayload: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckinService>(CheckinService);
    prisma = module.get(PrismaService);
    qrService = module.get(QRService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processCheckin', () => {
    const userId = 'user-1';
    const qrPayload = '{"event_id": "event-1", "sequence": 1}';

    it('should process checkin successfully for single checkin event', async () => {
      const mockEvent = createMockEvent({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        totalPoints: 100,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([]);

      const mockCheckin = createMockCheckin({
        eventId: mockEvent.id,
        userId,
        pointsAwarded: 100,
      });

      mockTransaction.mockImplementation(async (callback) => {
        return callback({
          eventCheckin: { create: jest.fn().mockResolvedValue(mockCheckin) },
          pointsBalance: {
            findUnique: jest.fn().mockResolvedValue({ id: 'pb-1', balance: 0 }),
            update: jest.fn(),
          },
          pointsTransaction: { create: jest.fn() },
        });
      });

      const result = await service.processCheckin(userId, qrPayload);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(100);
      expect(result.checkinNumber).toBe(1);
      expect(result.checkinsRemaining).toBe(0);
    });

    it('should throw BadRequestException for invalid QR payload', async () => {
      qrService.validatePayload.mockResolvedValue({
        valid: false,
        error: 'QR code invalido',
      });

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'QR code invalido',
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: 'event-1',
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for inactive event', async () => {
      const mockEvent = createMockEvent({
        id: 'event-1',
        status: EventStatus.DRAFT,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'Evento nao esta ativo',
      );
    });

    it('should throw BadRequestException when outside event time window', async () => {
      const futureEvent = createMockEvent({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        startAt: new Date(Date.now() + 3600000), // 1 hour from now
        endAt: new Date(Date.now() + 7200000), // 2 hours from now
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: futureEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(futureEvent);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'Evento fora do periodo de check-in',
      );
    });

    it('should throw BadRequestException if already checked in (single checkin)', async () => {
      const mockEvent = createMockEvent({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        allowMultipleCheckins: false,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([
        createMockCheckin({ eventId: mockEvent.id, userId }),
      ]);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'Check-in ja realizado neste evento',
      );
    });

    it('should throw BadRequestException if max checkins reached', async () => {
      const mockEvent = createMockEventWithMultipleCheckins({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        maxCheckinsPerUser: 2,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([
        createMockCheckin({ eventId: mockEvent.id, userId, qrTokenId: 'qr-1' }),
        createMockCheckin({ eventId: mockEvent.id, userId, qrTokenId: 'qr-2' }),
      ]);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'Limite de check-ins atingido',
      );
    });

    it('should throw BadRequestException if QR token already used', async () => {
      const mockEvent = createMockEventWithMultipleCheckins({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        maxCheckinsPerUser: 3,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-1',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([
        createMockCheckin({
          eventId: mockEvent.id,
          userId,
          qrTokenId: 'qr-token-1',
          createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        }),
      ]);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        'Este QR code ja foi utilizado',
      );
    });

    it('should throw BadRequestException if checkin interval not respected', async () => {
      const mockEvent = createMockEventWithMultipleCheckins({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        maxCheckinsPerUser: 3,
        checkinIntervalSeconds: 60,
      });

      qrService.validatePayload.mockResolvedValue({
        valid: true,
        eventId: mockEvent.id,
        qrTokenId: 'qr-token-2',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([
        createMockCheckin({
          eventId: mockEvent.id,
          userId,
          qrTokenId: 'qr-token-1',
          createdAt: new Date(Date.now() - 30000), // 30 seconds ago
        }),
      ]);

      await expect(service.processCheckin(userId, qrPayload)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEventCheckinStatus', () => {
    it('should return checkin status for user', async () => {
      const mockEvent = createMockEvent({
        id: 'event-1',
        status: EventStatus.ACTIVE,
        totalPoints: 100,
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventCheckin.findMany.mockResolvedValue([]);

      const result = await service.getEventCheckinStatus(mockEvent.id, 'user-1');

      expect(result.event.id).toBe(mockEvent.id);
      expect(result.userCheckinCount).toBe(0);
      expect(result.canCheckin).toBe(true);
    });

    it('should throw NotFoundException when event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.getEventCheckinStatus('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
