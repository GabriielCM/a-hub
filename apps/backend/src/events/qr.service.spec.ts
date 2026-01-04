import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { QRService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockEvent, createMockQRToken } from '../../test/factories';

describe('QRService', () => {
  let service: QRService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            eventQRToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            eventCheckin: {
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QRService>(QRService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePayload', () => {
    it('should generate a valid payload with HMAC signature', () => {
      const eventId = 'event-1';
      const sequence = 1;
      const expiresAt = new Date('2025-12-31T23:59:59Z');
      const secret = 'test-secret';

      const payload = service.generatePayload(eventId, sequence, expiresAt, secret);
      const parsed = JSON.parse(payload);

      expect(parsed.event_id).toBe(eventId);
      expect(parsed.sequence).toBe(sequence);
      expect(parsed.expires_at).toBe(expiresAt.toISOString());
      expect(parsed.hmac).toBeDefined();
      expect(typeof parsed.hmac).toBe('string');
      expect(parsed.hmac.length).toBe(64); // SHA256 hex length
    });

    it('should generate different HMACs for different secrets', () => {
      const eventId = 'event-1';
      const sequence = 1;
      const expiresAt = new Date('2025-12-31T23:59:59Z');

      const payload1 = JSON.parse(
        service.generatePayload(eventId, sequence, expiresAt, 'secret-1'),
      );
      const payload2 = JSON.parse(
        service.generatePayload(eventId, sequence, expiresAt, 'secret-2'),
      );

      expect(payload1.hmac).not.toBe(payload2.hmac);
    });
  });

  describe('validatePayload', () => {
    const mockEvent = createMockEvent({
      id: 'event-1',
      qrSecret: 'test-secret',
    });

    it('should validate a correct payload successfully', async () => {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      const payload = service.generatePayload(
        mockEvent.id,
        1,
        expiresAt,
        mockEvent.qrSecret,
      );

      const mockToken = createMockQRToken({
        eventId: mockEvent.id,
        sequence: 1,
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventQRToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.validatePayload(payload);

      expect(result.valid).toBe(true);
      expect(result.eventId).toBe(mockEvent.id);
      expect(result.qrTokenId).toBe(mockToken.id);
    });

    it('should return invalid for malformed JSON', async () => {
      const result = await service.validatePayload('invalid-json');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code invalido');
    });

    it('should return invalid for incomplete payload', async () => {
      const result = await service.validatePayload(
        JSON.stringify({ event_id: 'event-1' }),
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code incompleto');
    });

    it('should return invalid when event not found', async () => {
      const payload = JSON.stringify({
        event_id: 'non-existent',
        sequence: 1,
        expires_at: new Date().toISOString(),
        hmac: 'fake-hmac',
      });

      prisma.event.findUnique.mockResolvedValue(null);

      const result = await service.validatePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Evento nao encontrado');
    });

    it('should return invalid for wrong HMAC signature', async () => {
      const payload = JSON.stringify({
        event_id: mockEvent.id,
        sequence: 1,
        expires_at: new Date().toISOString(),
        hmac: 'wrong-hmac',
      });

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.validatePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code invalido');
    });

    it('should return invalid for expired payload', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      const payload = service.generatePayload(
        mockEvent.id,
        1,
        expiredDate,
        mockEvent.qrSecret,
      );

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.validatePayload(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR code expirado');
    });
  });

  describe('getCurrentToken', () => {
    it('should return existing token if found', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const mockToken = createMockQRToken({ eventId: mockEvent.id });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventQRToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.getCurrentToken(mockEvent.id);

      expect(result).toEqual(mockToken);
      expect(prisma.eventQRToken.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentToken('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create new token if not found', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const mockToken = createMockQRToken({ eventId: mockEvent.id });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventQRToken.findUnique.mockResolvedValue(null);
      prisma.eventQRToken.create.mockResolvedValue(mockToken);

      const result = await service.getCurrentToken(mockEvent.id);

      expect(prisma.eventQRToken.create).toHaveBeenCalled();
      expect(result).toEqual(mockToken);
    });
  });

  describe('getDisplayData', () => {
    it('should return display data for active event', async () => {
      const mockEvent = {
        ...createMockEvent({ status: EventStatus.ACTIVE }),
        _count: { checkins: 5 },
      };
      const mockToken = createMockQRToken({ eventId: mockEvent.id });

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.eventQRToken.findUnique.mockResolvedValue(mockToken);
      prisma.eventCheckin.groupBy.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      const result = await service.getDisplayData(mockEvent.id);

      expect(result.event.id).toBe(mockEvent.id);
      expect(result.qrPayload).toBe(mockToken.payload);
      expect(result.stats.totalCheckins).toBe(5);
      expect(result.stats.uniqueUsers).toBe(2);
    });

    it('should throw NotFoundException when event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getDisplayData('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for inactive event', async () => {
      const mockEvent = {
        ...createMockEvent({ status: EventStatus.DRAFT }),
        _count: { checkins: 0 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.getDisplayData(mockEvent.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
