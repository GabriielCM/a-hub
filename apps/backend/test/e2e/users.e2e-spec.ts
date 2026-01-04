import { INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
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
} from './helpers';
import { createMockUser } from '../factories';

describe('Users E2E', () => {
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

  describe('GET /api/users', () => {
    it('should list all users as admin', async () => {
      const mockUsers = [
        createMockUser({ role: Role.ADMIN }),
        createMockUser({ role: Role.COLLABORATOR }),
      ];
      ctx.prisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await api.get(app, '/users', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.get(app, '/users', tokens.userToken);

      expectForbidden(response);
    });

    it('should return 403 for display user', async () => {
      const response = await api.get(app, '/users', tokens.displayToken);

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/users');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/users/search', () => {
    it('should return users for search as authenticated user', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1', email: 'user1@test.com' },
        { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      ];
      ctx.prisma.user.findMany.mockResolvedValue(mockUsers);

      const response = await api.get(app, '/users/search', tokens.userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should work for admin user', async () => {
      ctx.prisma.user.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/users/search', tokens.adminToken);

      expect(response.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/users/search');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const mockUser = createMockUser({
        id: testUsers.user.id,
        email: testUsers.user.email,
        role: Role.COLLABORATOR,
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/me', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUsers.user.email);
    });

    it('should exclude password and refreshToken from response', async () => {
      const mockUser = createMockUser({
        id: testUsers.user.id,
        password: 'hashed_password',
        refreshToken: 'some_refresh_token',
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/me', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
      expect(response.body.refreshToken).toBeUndefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/users/me');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details as admin', async () => {
      const mockUser = createMockUser({ id: 'user-1' });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/user-1', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-1');
    });

    it('should exclude password and refreshToken from response', async () => {
      const mockUser = createMockUser({
        id: 'user-1',
        password: 'hashed_password',
        refreshToken: 'some_refresh_token',
      });
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await api.get(app, '/users/user-1', tokens.adminToken);

      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
      expect(response.body.refreshToken).toBeUndefined();
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.get(app, '/users/user-1', tokens.userToken);

      expectForbidden(response);
    });

    it('should return 404 for non-existent user', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const response = await api.get(
        app,
        '/users/non-existent',
        tokens.adminToken,
      );

      expectNotFound(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/users/user-1');

      expectUnauthorized(response);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user as admin', async () => {
      const mockUser = createMockUser({ id: 'user-1', name: 'Old Name' });
      const updatedUser = { ...mockUser, name: 'New Name' };

      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);
      ctx.prisma.user.update.mockResolvedValue(updatedUser);

      const response = await api.patch(
        app,
        '/users/user-1',
        { name: 'New Name' },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
    });

    it('should allow admin to change user role', async () => {
      const mockUser = createMockUser({
        id: 'user-1',
        role: Role.COLLABORATOR,
      });
      const updatedUser = { ...mockUser, role: Role.ADMIN };

      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);
      ctx.prisma.user.update.mockResolvedValue(updatedUser);

      const response = await api.patch(
        app,
        '/users/user-1',
        { role: Role.ADMIN },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.role).toBe(Role.ADMIN);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.patch(
        app,
        '/users/user-1',
        { name: 'New Name' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.patch(app, '/users/user-1', {
        name: 'New Name',
      });

      expectUnauthorized(response);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {
      const mockUser = createMockUser({ id: 'user-1' });

      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);
      ctx.prisma.user.delete.mockResolvedValue(mockUser);

      const response = await api.delete(
        app,
        '/users/user-1',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.delete(app, '/users/user-1', tokens.userToken);

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.delete(app, '/users/user-1');

      expectUnauthorized(response);
    });
  });
});
