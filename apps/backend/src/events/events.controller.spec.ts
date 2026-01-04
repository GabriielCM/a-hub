import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus } from '@prisma/client';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { QRService } from './qr.service';
import { CheckinService } from './checkin.service';
import { createMockEvent } from '../../test/factories';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: jest.Mocked<EventsService>;
  let qrService: jest.Mocked<QRService>;
  let checkinService: jest.Mocked<CheckinService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            updateStatus: jest.fn(),
            getAvailable: jest.fn(),
            getUserEvents: jest.fn(),
          },
        },
        {
          provide: QRService,
          useValue: {
            getCurrentToken: jest.fn(),
          },
        },
        {
          provide: CheckinService,
          useValue: {
            processCheckin: jest.fn(),
            getUserCheckins: jest.fn(),
            getEventCheckinStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
    qrService = module.get(QRService);
    checkinService = module.get(CheckinService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /events', () => {
    it('should create a new event', async () => {
      const createDto = {
        name: 'Test Event',
        description: 'Test',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
        totalPoints: 100,
      };
      const mockEvent = { ...createMockEvent(), createdBy: {}, _count: { checkins: 0 } };
      eventsService.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createDto, 'admin-1');

      expect(eventsService.create).toHaveBeenCalledWith(createDto, 'admin-1');
      expect(result).toBeDefined();
    });
  });

  describe('GET /events', () => {
    it('should return all events with query filters', async () => {
      const mockEvents = [
        { ...createMockEvent(), createdBy: {}, _count: { checkins: 0 } },
      ];
      eventsService.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll({ status: EventStatus.ACTIVE });

      expect(eventsService.findAll).toHaveBeenCalledWith({ status: EventStatus.ACTIVE });
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /events/:id', () => {
    it('should return an event by id', async () => {
      const mockEvent = { ...createMockEvent({ id: 'event-1' }), createdBy: {}, _count: { checkins: 5 } };
      eventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('event-1');

      expect(eventsService.findOne).toHaveBeenCalledWith('event-1');
      expect(result.id).toBe('event-1');
    });
  });

  describe('PATCH /events/:id', () => {
    it('should update an event', async () => {
      const updateDto = { name: 'Updated Event' };
      const mockEvent = { ...createMockEvent({ name: 'Updated Event' }), createdBy: {}, _count: { checkins: 0 } };
      eventsService.update.mockResolvedValue(mockEvent);

      const result = await controller.update('event-1', updateDto);

      expect(eventsService.update).toHaveBeenCalledWith('event-1', updateDto);
      expect(result.name).toBe('Updated Event');
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete an event', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      eventsService.remove.mockResolvedValue(mockEvent);

      const result = await controller.remove('event-1');

      expect(eventsService.remove).toHaveBeenCalledWith('event-1');
      expect(result.id).toBe('event-1');
    });
  });

  describe('PATCH /events/:id/status', () => {
    it('should update event status', async () => {
      const mockEvent = { ...createMockEvent({ status: EventStatus.ACTIVE }), createdBy: {}, _count: { checkins: 0 } };
      eventsService.updateStatus.mockResolvedValue(mockEvent);

      const result = await controller.updateStatus('event-1', { status: EventStatus.ACTIVE });

      expect(eventsService.updateStatus).toHaveBeenCalledWith('event-1', EventStatus.ACTIVE);
      expect(result.status).toBe(EventStatus.ACTIVE);
    });
  });

  describe('GET /events/:id/qr/current', () => {
    it('should return current QR token', async () => {
      const mockToken = { token: 'abc123', expiresAt: new Date() };
      qrService.getCurrentToken.mockResolvedValue(mockToken);

      const result = await controller.getCurrentQR('event-1');

      expect(qrService.getCurrentToken).toHaveBeenCalledWith('event-1');
      expect(result.token).toBe('abc123');
    });
  });

  describe('GET /events/user/available', () => {
    it('should return available events', async () => {
      const mockEvents = [{ id: 'event-1', name: 'Available Event' }];
      eventsService.getAvailable.mockResolvedValue(mockEvents);

      const result = await controller.getAvailable();

      expect(eventsService.getAvailable).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /events/user/events', () => {
    it('should return user events with checkin info', async () => {
      const mockEvents = [{ id: 'event-1', userCheckinCount: 1, canCheckin: true }];
      eventsService.getUserEvents.mockResolvedValue(mockEvents);

      const result = await controller.getUserEvents('user-1');

      expect(eventsService.getUserEvents).toHaveBeenCalledWith('user-1');
      expect(result[0].userCheckinCount).toBe(1);
    });
  });

  describe('POST /events/checkin', () => {
    it('should process checkin', async () => {
      const mockResult = { success: true, pointsAwarded: 100, checkinNumber: 1 };
      checkinService.processCheckin.mockResolvedValue(mockResult);

      const result = await controller.checkin({ qrPayload: 'valid-payload' }, 'user-1');

      expect(checkinService.processCheckin).toHaveBeenCalledWith('user-1', 'valid-payload');
      expect(result.success).toBe(true);
    });
  });

  describe('GET /events/:id/my-checkins', () => {
    it('should return user checkins for an event', async () => {
      const mockCheckins = [{ id: 'checkin-1', pointsAwarded: 100 }];
      checkinService.getUserCheckins.mockResolvedValue(mockCheckins);

      const result = await controller.getMyCheckins('event-1', 'user-1');

      expect(checkinService.getUserCheckins).toHaveBeenCalledWith('event-1', 'user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /events/:id/checkin-status', () => {
    it('should return checkin status for an event', async () => {
      const mockStatus = { canCheckin: true, checkinsRemaining: 2 };
      checkinService.getEventCheckinStatus.mockResolvedValue(mockStatus);

      const result = await controller.getCheckinStatus('event-1', 'user-1');

      expect(checkinService.getEventCheckinStatus).toHaveBeenCalledWith('event-1', 'user-1');
      expect(result.canCheckin).toBe(true);
    });
  });
});
