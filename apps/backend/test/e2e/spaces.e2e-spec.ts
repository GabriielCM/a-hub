import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  resetTestState,
  generateTestTokens,
  TestContext,
  TestTokens,
} from '../e2e-setup';
import {
  api,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  expectValidationError,
} from './helpers';
import { createMockSpace } from '../factories';

describe('Spaces E2E', () => {
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

  describe('GET /api/spaces', () => {
    it('should list all spaces (public)', async () => {
      const mockSpaces = [createMockSpace(), createMockSpace()];
      ctx.prisma.space.findMany.mockResolvedValue(mockSpaces);

      const response = await api.get(app, '/spaces');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return empty array when no spaces', async () => {
      ctx.prisma.space.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/spaces');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/spaces/:id', () => {
    it('should return space details', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);

      const response = await api.get(app, '/spaces/space-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('space-1');
      expect(response.body.name).toBeDefined();
    });

    it('should return 404 for non-existent space', async () => {
      ctx.prisma.space.findUnique.mockResolvedValue(null);

      const response = await api.get(app, '/spaces/non-existent');

      expectNotFound(response);
    });
  });

  describe('GET /api/spaces/:id/availability', () => {
    it('should return availability for specified month', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.booking.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/spaces/space-1/availability?month=6&year=2025');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should use current month when not specified', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.booking.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/spaces/space-1/availability');

      expect(response.status).toBe(200);
    });

    it('should return availability for non-existent space (empty result)', async () => {
      // Note: The service doesn't validate space existence for availability
      // It returns empty bookedDates for any spaceId
      ctx.prisma.booking.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/spaces/non-existent/availability');

      expect(response.status).toBe(200);
      expect(response.body.bookedDates).toEqual([]);
    });
  });

  describe('POST /api/spaces', () => {
    const validSpaceData = {
      name: 'New Space',
      value: 150.0,
      description: 'A new test space',
    };

    it('should create space as admin', async () => {
      const mockSpace = createMockSpace(validSpaceData);
      ctx.prisma.space.create.mockResolvedValue(mockSpace);

      const response = await api.post(
        app,
        '/spaces',
        validSpaceData,
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Space');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.post(
        app,
        '/spaces',
        validSpaceData,
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 403 for display user', async () => {
      const response = await api.post(
        app,
        '/spaces',
        validSpaceData,
        tokens.displayToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.post(app, '/spaces', validSpaceData);

      expectUnauthorized(response);
    });

    it('should return 400 for missing name', async () => {
      const response = await api.post(
        app,
        '/spaces',
        { value: 150.0 },
        tokens.adminToken,
      );

      expectValidationError(response);
    });

    it('should return 400 for missing value', async () => {
      const response = await api.post(
        app,
        '/spaces',
        { name: 'Test Space' },
        tokens.adminToken,
      );

      expectValidationError(response);
    });
  });

  describe('PATCH /api/spaces/:id', () => {
    it('should update space as admin', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });
      const updatedSpace = { ...mockSpace, name: 'Updated Name' };

      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.space.update.mockResolvedValue(updatedSpace);

      const response = await api.patch(
        app,
        '/spaces/space-1',
        { name: 'Updated Name' },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.patch(
        app,
        '/spaces/space-1',
        { name: 'Updated Name' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.patch(app, '/spaces/space-1', {
        name: 'Updated Name',
      });

      expectUnauthorized(response);
    });
  });

  describe('DELETE /api/spaces/:id', () => {
    it('should delete space as admin', async () => {
      const mockSpace = createMockSpace({ id: 'space-1' });

      ctx.prisma.space.findUnique.mockResolvedValue(mockSpace);
      ctx.prisma.space.delete.mockResolvedValue(mockSpace);

      const response = await api.delete(
        app,
        '/spaces/space-1',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.delete(
        app,
        '/spaces/space-1',
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.delete(app, '/spaces/space-1');

      expectUnauthorized(response);
    });
  });
});
