import { INestApplication } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import {
  createTestApp,
  resetTestState,
  generateTestTokens,
  TestContext,
  TestTokens,
  testUsers,
} from '../e2e-setup';
import {
  api,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  expectValidationError,
} from './helpers';
import {
  createMockEvent,
  createMockQRToken,
  createMockCheckin,
} from '../factories';
import { createMockPointsBalance } from '../factories';

describe('Events E2E', () => {
  let app: INestApplication;
  let ctx: TestContext;
  let tokens: TestTokens;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    tokens = generateTestTokens(ctx.jwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetTestState(ctx.prisma);
  });

  // ==================== Admin Endpoints ====================

  describe('POST /api/events (Admin)', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const endDate = new Date(futureDate);
    endDate.setHours(endDate.getHours() + 2);

    const validEventDto = {
      name: 'Test Event',
      description: 'Test Description',
      startAt: futureDate.toISOString(),
      endAt: endDate.toISOString(),
      totalPoints: 100,
      allowMultipleCheckins: false,
    };

    it('should allow admin to create event', async () => {
      const mockEvent = createMockEvent({
        name: validEventDto.name,
        createdById: testUsers.admin.id,
      });
      ctx.prisma.event.create.mockResolvedValue(mockEvent);

      const response = await api.post(
        app,
        '/events',
        validEventDto,
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(validEventDto.name);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.post(
        app,
        '/events',
        validEventDto,
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await api.post(
        app,
        '/events',
        { name: 'Test' },
        tokens.adminToken,
      );

      expectValidationError(response);
    });

    it('should return 401 without auth', async () => {
      const response = await api.post(app, '/events', validEventDto);

      expectUnauthorized(response);
    });
  });

  describe('GET /api/events (Admin)', () => {
    it('should return all events for admin', async () => {
      const mockEvents = [createMockEvent(), createMockEvent()];
      ctx.prisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await api.get(app, '/events', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should filter events by status', async () => {
      const activeEvent = createMockEvent({ status: EventStatus.ACTIVE });
      ctx.prisma.event.findMany.mockResolvedValue([activeEvent]);

      const response = await api.get(
        app,
        '/events?status=ACTIVE',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(app, '/events', tokens.userToken);

      expectForbidden(response);
    });
  });

  describe('GET /api/events/:id (Admin)', () => {
    it('should return event by id for admin', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);

      const response = await api.get(app, '/events/event-1', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('event-1');
    });

    it('should return 404 for non-existent event', async () => {
      ctx.prisma.event.findUnique.mockResolvedValue(null);

      const response = await api.get(
        app,
        '/events/non-existent',
        tokens.adminToken,
      );

      expectNotFound(response);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(app, '/events/event-1', tokens.userToken);

      expectForbidden(response);
    });
  });

  describe('PATCH /api/events/:id (Admin)', () => {
    it('should allow admin to update event', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const updatedEvent = { ...mockEvent, name: 'Updated Event' };

      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.event.update.mockResolvedValue(updatedEvent);

      const response = await api.patch(
        app,
        '/events/event-1',
        { name: 'Updated Event' },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Event');
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.patch(
        app,
        '/events/event-1',
        { name: 'Updated' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 404 for non-existent event', async () => {
      ctx.prisma.event.findUnique.mockResolvedValue(null);

      const response = await api.patch(
        app,
        '/events/non-existent',
        { name: 'Updated' },
        tokens.adminToken,
      );

      expectNotFound(response);
    });
  });

  describe('DELETE /api/events/:id (Admin)', () => {
    it('should allow admin to delete event', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.event.delete.mockResolvedValue(mockEvent);

      const response = await api.delete(
        app,
        '/events/event-1',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.delete(app, '/events/event-1', tokens.userToken);

      expectForbidden(response);
    });

    it('should return 404 for non-existent event', async () => {
      ctx.prisma.event.findUnique.mockResolvedValue(null);

      const response = await api.delete(
        app,
        '/events/non-existent',
        tokens.adminToken,
      );

      expectNotFound(response);
    });
  });

  describe('PATCH /api/events/:id/status (Admin)', () => {
    it('should allow admin to update event status', async () => {
      const mockEvent = createMockEvent({ id: 'event-1', status: EventStatus.DRAFT });
      const updatedEvent = { ...mockEvent, status: EventStatus.ACTIVE };

      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.event.update.mockResolvedValue(updatedEvent);

      const response = await api.patch(
        app,
        '/events/event-1/status',
        { status: EventStatus.ACTIVE },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(EventStatus.ACTIVE);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.patch(
        app,
        '/events/event-1/status',
        { status: EventStatus.ACTIVE },
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  describe('GET /api/events/:id/qr/current (Admin/Display)', () => {
    it('should return current QR token for admin', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const mockQRToken = createMockQRToken({ eventId: 'event-1' });

      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.eventQRToken.findFirst.mockResolvedValue(mockQRToken);

      const response = await api.get(
        app,
        '/events/event-1/qr/current',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return current QR token for display', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const mockQRToken = createMockQRToken({ eventId: 'event-1' });

      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.eventQRToken.findFirst.mockResolvedValue(mockQRToken);

      const response = await api.get(
        app,
        '/events/event-1/qr/current',
        tokens.displayToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for collaborator', async () => {
      const response = await api.get(
        app,
        '/events/event-1/qr/current',
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  // ==================== User Endpoints ====================

  describe('GET /api/events/user/available', () => {
    it('should return available events for user', async () => {
      const mockEvents = [createMockEvent({ status: EventStatus.ACTIVE })];
      ctx.prisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await api.get(
        app,
        '/events/user/available',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/events/user/available');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/events/user/events', () => {
    it('should return user events with checkins', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Test Event',
          description: 'Description',
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
          totalPoints: 100,
          allowMultipleCheckins: false,
          maxCheckinsPerUser: null,
          checkins: [], // Array of checkins
        },
      ];
      ctx.prisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await api.get(
        app,
        '/events/user/events',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/events/user/events');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/events/checkin', () => {
    it('should return 400 for invalid QR payload format', async () => {
      // QR payload validation happens in QRService which uses real crypto
      // Testing with invalid payload to verify error handling
      const response = await api.post(
        app,
        '/events/checkin',
        { qrPayload: 'invalid-payload-format' },
        tokens.userToken,
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty QR payload', async () => {
      const response = await api.post(
        app,
        '/events/checkin',
        { qrPayload: '' },
        tokens.userToken,
      );

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await api.post(app, '/events/checkin', {
        qrPayload: 'test-payload',
      });

      expectUnauthorized(response);
    });
  });

  describe('GET /api/events/:id/my-checkins', () => {
    it('should return user checkins for event', async () => {
      const mockCheckins = [
        createMockCheckin({ eventId: 'event-1', userId: testUsers.user.id }),
      ];
      ctx.prisma.eventCheckin.findMany.mockResolvedValue(mockCheckins);

      const response = await api.get(
        app,
        '/events/event-1/my-checkins',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/events/event-1/my-checkins');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/events/:id/checkin-status', () => {
    it('should return checkin status for event', async () => {
      const mockEvent = createMockEvent({ id: 'event-1' });
      const mockCheckins = [
        createMockCheckin({ eventId: 'event-1', userId: testUsers.user.id }),
      ];

      ctx.prisma.event.findUnique.mockResolvedValue(mockEvent);
      ctx.prisma.eventCheckin.findMany.mockResolvedValue(mockCheckins);

      const response = await api.get(
        app,
        '/events/event-1/checkin-status',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/events/event-1/checkin-status');

      expectUnauthorized(response);
    });
  });
});
