import { INestApplication } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
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
  expectConflict,
} from './helpers';
import {
  createMockBooking,
  createMockBookingWithRelations,
  createMockSpace,
  createMockUser,
} from '../factories';

describe('Bookings E2E', () => {
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

  describe('POST /api/bookings', () => {
    const getFutureDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString().split('T')[0];
    };

    it('should create booking with valid data', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      const mockBooking = createMockBooking({
        userId: testUsers.user.id,
        spaceId: 'space-1',
      });

      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.booking.findFirst.mockResolvedValue(null);
      ctx.prisma.booking.create.mockResolvedValue({
        ...mockBooking,
        space: mockSpace,
      });

      const response = await api.post(
        app,
        '/bookings',
        { spaceId: 'space-1', date: getFutureDate() },
        tokens.userToken,
      );

      expect(response.status).toBe(201);
      expect(response.body.status).toBe(BookingStatus.PENDING);
      expect(response.body.spaceId).toBe('space-1');
    });

    it('should return 401 without authentication', async () => {
      const response = await api.post(app, '/bookings', {
        spaceId: 'space-1',
        date: getFutureDate(),
      });

      expectUnauthorized(response);
    });

    it('should return 400 for missing spaceId', async () => {
      const response = await api.post(
        app,
        '/bookings',
        { date: getFutureDate() },
        tokens.userToken,
      );

      expectValidationError(response);
    });

    it('should return 400 for missing date', async () => {
      const response = await api.post(
        app,
        '/bookings',
        { spaceId: 'space-1' },
        tokens.userToken,
      );

      expectValidationError(response);
    });

    it('should return 404 for non-existent space', async () => {
      ctx.prisma.space.findUnique.mockResolvedValue(null);

      const response = await api.post(
        app,
        '/bookings',
        { spaceId: 'non-existent', date: getFutureDate() },
        tokens.userToken,
      );

      expectNotFound(response);
    });

    it('should return 400 for past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockSpace = createMockSpace({ id: 'space-1' });
      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);

      const response = await api.post(
        app,
        '/bookings',
        { spaceId: 'space-1', date: pastDate.toISOString().split('T')[0] },
        tokens.userToken,
      );

      expect(response.status).toBe(400);
    });

    it('should return 409 for date conflict', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      const existingBooking = createMockBooking({ spaceId: 'space-1' });

      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.booking.findFirst.mockResolvedValue(existingBooking);

      const response = await api.post(
        app,
        '/bookings',
        { spaceId: 'space-1', date: getFutureDate() },
        tokens.userToken,
      );

      expectConflict(response);
    });
  });

  describe('GET /api/bookings', () => {
    it('should return user bookings', async () => {
      const mockBookings = [
        createMockBookingWithRelations({ userId: testUsers.user.id }),
      ];
      ctx.prisma.booking.findMany.mockResolvedValue(mockBookings);

      const response = await api.get(app, '/bookings', tokens.userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/bookings');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/bookings/all', () => {
    it('should return all bookings for admin', async () => {
      const mockBookings = [
        createMockBookingWithRelations(),
        createMockBookingWithRelations(),
      ];
      ctx.prisma.booking.findMany.mockResolvedValue(mockBookings);

      const response = await api.get(app, '/bookings/all', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.get(app, '/bookings/all', tokens.userToken);

      expectForbidden(response);
    });
  });

  describe('GET /api/bookings/export', () => {
    it('should return CSV content for admin', async () => {
      const mockBookings = [createMockBookingWithRelations()];
      ctx.prisma.booking.findMany.mockResolvedValue(mockBookings);

      const response = await api.get(app, '/bookings/export', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.get(app, '/bookings/export', tokens.userToken);

      expectForbidden(response);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return booking details', async () => {
      const mockBooking = createMockBookingWithRelations({ id: 'booking-1' });
      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const response = await api.get(app, '/bookings/booking-1', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('booking-1');
    });

    it('should return 404 for non-existent booking', async () => {
      ctx.prisma.booking.findUnique.mockResolvedValue(null);

      const response = await api.get(
        app,
        '/bookings/non-existent',
        tokens.userToken,
      );

      expectNotFound(response);
    });
  });

  describe('PATCH /api/bookings/:id', () => {
    it('should allow admin to approve booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });
      const approvedBooking = {
        ...mockBooking,
        status: BookingStatus.APPROVED,
      };

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);
      ctx.prisma.booking.update.mockResolvedValue(approvedBooking);

      const response = await api.patch(
        app,
        '/bookings/booking-1',
        { status: BookingStatus.APPROVED },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(BookingStatus.APPROVED);
    });

    it('should allow admin to reject booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });
      const rejectedBooking = {
        ...mockBooking,
        status: BookingStatus.REJECTED,
      };

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);
      ctx.prisma.booking.update.mockResolvedValue(rejectedBooking);

      const response = await api.patch(
        app,
        '/bookings/booking-1',
        { status: BookingStatus.REJECTED },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(BookingStatus.REJECTED);
    });

    it('should allow user to cancel their own booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: testUsers.user.id,
        status: BookingStatus.PENDING,
      });
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);
      ctx.prisma.booking.update.mockResolvedValue(cancelledBooking);

      const response = await api.patch(
        app,
        '/bookings/booking-1',
        { status: BookingStatus.CANCELLED },
        tokens.userToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(BookingStatus.CANCELLED);
    });

    it('should return 403 when user tries to cancel another user booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: 'another-user-id',
        status: BookingStatus.PENDING,
      });

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const response = await api.patch(
        app,
        '/bookings/booking-1',
        { status: BookingStatus.CANCELLED },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 403 when non-admin tries to approve', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: testUsers.user.id,
        status: BookingStatus.PENDING,
      });

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const response = await api.patch(
        app,
        '/bookings/booking-1',
        { status: BookingStatus.APPROVED },
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should allow user to delete their own booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: testUsers.user.id,
      });

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);
      ctx.prisma.booking.delete.mockResolvedValue(mockBooking);

      const response = await api.delete(
        app,
        '/bookings/booking-1',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
    });

    it('should allow admin to delete any booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: 'another-user-id',
      });

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);
      ctx.prisma.booking.delete.mockResolvedValue(mockBooking);

      const response = await api.delete(
        app,
        '/bookings/booking-1',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 when user tries to delete another user booking', async () => {
      const mockBooking = createMockBooking({
        id: 'booking-1',
        userId: 'another-user-id',
      });

      ctx.prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const response = await api.delete(
        app,
        '/bookings/booking-1',
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 404 for non-existent booking', async () => {
      ctx.prisma.booking.findUnique.mockResolvedValue(null);

      const response = await api.delete(
        app,
        '/bookings/non-existent',
        tokens.userToken,
      );

      expectNotFound(response);
    });
  });
});
