import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  resetTestState,
  generateTestTokens,
  TestContext,
  TestTokens,
  testUsers,
} from '../e2e-setup';
import { api, expectUnauthorized, expectForbidden } from './helpers';
import { createMockUser, createMockAdmin, createMockSpace } from '../factories';

describe('Access Control E2E', () => {
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

  describe('Authentication Required', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      const response = await api.get(app, '/users/me');
      expectUnauthorized(response);
    });

    it('should accept valid JWT token', async () => {
      const mockUser = createMockUser({
        id: testUsers.user.id,
        email: testUsers.user.email,
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/me', tokens.userToken);
      expect(response.status).toBe(200);
    });

    it('should reject expired JWT token', async () => {
      // Create an expired token (sign with very short expiration that's already passed)
      const expiredToken = ctx.jwtService.sign(
        { sub: 'test', email: 'test@test.com', role: 'COLLABORATOR' },
        { expiresIn: '-1s' },
      );

      const response = await api.get(app, '/users/me', expiredToken);
      expectUnauthorized(response);
    });

    it('should reject malformed JWT token', async () => {
      const response = await api.get(app, '/users/me', 'invalid.token.here');
      expectUnauthorized(response);
    });

    it('should reject token without Bearer prefix', async () => {
      const response = await api.get(app, '/users/me')
        .set('Authorization', tokens.userToken);
      expectUnauthorized(response);
    });
  });

  describe('ADMIN Role Access', () => {
    it('should allow admin to access admin-only endpoint (GET /users)', async () => {
      ctx.prisma.user.findMany.mockResolvedValue([createMockAdmin()]);

      const response = await api.get(app, '/users', tokens.adminToken);
      expect(response.status).toBe(200);
    });

    it('should allow admin to access GET /bookings/all', async () => {
      ctx.prisma.booking.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/bookings/all', tokens.adminToken);
      expect(response.status).toBe(200);
    });

    it('should allow admin to access POST /spaces', async () => {
      const mockSpace = createMockSpace();
      ctx.prisma.space.findFirst.mockResolvedValue(null);
      ctx.prisma.space.create.mockResolvedValue(mockSpace);

      const response = await api.post(
        app,
        '/spaces',
        { name: 'Test Space', value: 100 },
        tokens.adminToken,
      );
      expect(response.status).toBe(201);
    });

    it('should allow admin to access user endpoints', async () => {
      const mockUser = createMockUser({
        id: testUsers.admin.id,
        email: testUsers.admin.email,
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/me', tokens.adminToken);
      expect(response.status).toBe(200);
    });
  });

  describe('COLLABORATOR Role Access', () => {
    it('should allow collaborator to access user endpoints', async () => {
      const mockUser = createMockUser({
        id: testUsers.user.id,
        email: testUsers.user.email,
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/me', tokens.userToken);
      expect(response.status).toBe(200);
    });

    it('should deny collaborator access to admin-only GET /users', async () => {
      const response = await api.get(app, '/users', tokens.userToken);
      expectForbidden(response);
    });

    it('should deny collaborator access to POST /spaces', async () => {
      const response = await api.post(
        app,
        '/spaces',
        { name: 'Test Space', value: 100 },
        tokens.userToken,
      );
      expectForbidden(response);
    });

    it('should deny collaborator access to GET /bookings/all', async () => {
      const response = await api.get(app, '/bookings/all', tokens.userToken);
      expectForbidden(response);
    });
  });

  describe('DISPLAY Role Access', () => {
    it('should allow display to access public endpoints', async () => {
      ctx.prisma.space.findMany.mockResolvedValue([createMockSpace()]);

      const response = await api.get(app, '/spaces', tokens.displayToken);
      expect(response.status).toBe(200);
    });

    it('should deny display access to admin endpoints', async () => {
      const response = await api.get(app, '/users', tokens.displayToken);
      expectForbidden(response);
    });

    it('should deny display access to POST /spaces (admin only)', async () => {
      const response = await api.post(
        app,
        '/spaces',
        { name: 'Test Space', value: 100 },
        tokens.displayToken,
      );
      expectForbidden(response);
    });
  });

  describe('Public Endpoints', () => {
    it('should allow access to GET /spaces without authentication', async () => {
      ctx.prisma.space.findMany.mockResolvedValue([createMockSpace()]);

      const response = await api.get(app, '/spaces');
      expect(response.status).toBe(200);
    });

    it('should allow access to GET /benefits without authentication', async () => {
      ctx.prisma.benefit.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/benefits');
      expect(response.status).toBe(200);
    });
  });
});
