import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockEvent, createMockEventWithMultipleCheckins } from '../../test/factories';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validDto = {
      name: 'Test Event',
      description: 'A test event',
      startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endAt: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      totalPoints: 100,
    };

    it('should create an event successfully', async () => {
      const mockEvent = {
        ...createMockEvent(),
        createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
        _count: { checkins: 0 },
      };

      prisma.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(validDto, 'admin-1');

      expect(prisma.event.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if endAt is before startAt', async () => {
      const invalidDto = {
        ...validDto,
        startAt: new Date(Date.now() + 172800000).toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      };

      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        'Data de termino deve ser posterior a data de inicio',
      );
    });

    it('should throw BadRequestException if allowMultipleCheckins without maxCheckinsPerUser', async () => {
      const invalidDto = {
        ...validDto,
        allowMultipleCheckins: true,
        checkinIntervalSeconds: 300,
      };

      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        'maxCheckinsPerUser e obrigatorio quando allowMultipleCheckins e true',
      );
    });

    it('should throw BadRequestException if allowMultipleCheckins without checkinIntervalSeconds', async () => {
      const invalidDto = {
        ...validDto,
        allowMultipleCheckins: true,
        maxCheckinsPerUser: 3,
      };

      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, 'admin-1')).rejects.toThrow(
        'checkinIntervalSeconds e obrigatorio quando allowMultipleCheckins e true',
      );
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const mockEvents = [
        { ...createMockEvent(), createdBy: {}, _count: { checkins: 0 } },
        { ...createMockEvent(), createdBy: {}, _count: { checkins: 5 } },
      ];

      prisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll({});

      expect(prisma.event.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      prisma.event.findMany.mockResolvedValue([]);

      await service.findAll({ status: EventStatus.ACTIVE });

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EventStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const mockEvent = {
        ...createMockEvent(),
        createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
        _count: { checkins: 5 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(mockEvent.id);

      expect(result.id).toBe(mockEvent.id);
    });

    it('should throw NotFoundException if event not found', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Evento nao encontrado',
      );
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const mockEvent = {
        ...createMockEvent(),
        createdBy: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
        _count: { checkins: 0 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.event.update.mockResolvedValue({
        ...mockEvent,
        name: 'Updated Event',
      });

      const result = await service.update(mockEvent.id, { name: 'Updated Event' });

      expect(result.name).toBe('Updated Event');
    });

    it('should throw BadRequestException for invalid date update', async () => {
      const mockEvent = {
        ...createMockEvent(),
        createdBy: {},
        _count: { checkins: 0 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);

      await expect(
        service.update(mockEvent.id, {
          startAt: new Date(Date.now() + 172800000).toISOString(),
          endAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      const mockEvent = {
        ...createMockEvent(),
        createdBy: {},
        _count: { checkins: 0 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.event.delete.mockResolvedValue(mockEvent);

      const result = await service.remove(mockEvent.id);

      expect(prisma.event.delete).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
      });
      expect(result.id).toBe(mockEvent.id);
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      const mockEvent = {
        ...createMockEvent({ status: EventStatus.DRAFT }),
        createdBy: {},
        _count: { checkins: 0 },
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.event.update.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.ACTIVE,
      });

      const result = await service.updateStatus(mockEvent.id, EventStatus.ACTIVE);

      expect(result.status).toBe(EventStatus.ACTIVE);
    });
  });

  describe('getAvailable', () => {
    it('should return active events happening now', async () => {
      const mockEvents = [
        { ...createMockEvent({ status: EventStatus.ACTIVE }), _count: { checkins: 0 } },
      ];

      prisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getAvailable();

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EventStatus.ACTIVE,
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getUpcoming', () => {
    it('should return future active events', async () => {
      prisma.event.findMany.mockResolvedValue([]);

      await service.getUpcoming();

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EventStatus.ACTIVE,
            startAt: { gt: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('getUserEvents', () => {
    it('should return events with user checkin info', async () => {
      const mockEvents = [
        {
          ...createMockEvent(),
          allowMultipleCheckins: false,
          maxCheckinsPerUser: null,
          checkins: [],
        },
      ];

      prisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getUserEvents('user-1');

      expect(result[0].userCheckinCount).toBe(0);
      expect(result[0].canCheckin).toBe(true);
    });

    it('should return canCheckin false if user already checked in to single-checkin event', async () => {
      const mockEvents = [
        {
          ...createMockEvent(),
          allowMultipleCheckins: false,
          maxCheckinsPerUser: null,
          checkins: [{ id: 'checkin-1', checkinNumber: 1, pointsAwarded: 100, createdAt: new Date() }],
        },
      ];

      prisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.getUserEvents('user-1');

      expect(result[0].userCheckinCount).toBe(1);
      expect(result[0].canCheckin).toBe(false);
    });
  });
});
