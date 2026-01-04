import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  resetTestState,
  generateTestTokens,
  TestContext,
  TestTokens,
  testUsers,
} from '../e2e-setup';
import { api, expectUnauthorized, expectValidationError, expectConflict } from './helpers';
import { createMockUser } from '../factories';

describe('Auth E2E', () => {
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

  describe('POST /api/auth/register', () => {
    const validRegisterDto = {
      email: 'newuser@test.com',
      password: 'password123',
      name: 'New User',
    };

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser({
        email: validRegisterDto.email,
        name: validRegisterDto.name,
      });

      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(null);
      ctx.prisma.user.create.mockResolvedValue(mockUser);
      ctx.prisma.user.update.mockResolvedValue(mockUser);

      const response = await api.post(app, '/auth/register', validRegisterDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(validRegisterDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await api.post(app, '/auth/register', {
        email: 'invalid-email',
        password: 'password123',
        name: 'New User',
      });

      expectValidationError(response);
    });

    it('should return 400 for password less than 6 characters', async () => {
      const response = await api.post(app, '/auth/register', {
        email: 'test@test.com',
        password: '12345',
        name: 'New User',
      });

      expectValidationError(response);
    });

    it('should return 400 for missing name', async () => {
      const response = await api.post(app, '/auth/register', {
        email: 'test@test.com',
        password: 'password123',
      });

      expectValidationError(response);
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = createMockUser({ email: validRegisterDto.email });
      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(existingUser);

      const response = await api.post(app, '/auth/register', validRegisterDto);

      expectConflict(response);
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginDto = {
      email: 'user@test.com',
      password: 'correct_password',
    };

    it('should login with valid credentials', async () => {
      const mockUser = createMockUser({ email: validLoginDto.email });

      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);
      ctx.prisma.user.update.mockResolvedValue(mockUser);

      const response = await api.post(app, '/auth/login', validLoginDto);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(validLoginDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return tokens with correct structure', async () => {
      const mockUser = createMockUser({ email: validLoginDto.email });

      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);
      ctx.prisma.user.update.mockResolvedValue(mockUser);

      const response = await api.post(app, '/auth/login', validLoginDto);

      expect(response.status).toBe(200);
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(response.body.accessToken.split('.')).toHaveLength(3); // JWT format
    });

    it('should return 401 for non-existent email', async () => {
      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const response = await api.post(app, '/auth/login', validLoginDto);

      expectUnauthorized(response);
    });

    it('should return 401 for incorrect password', async () => {
      const mockUser = createMockUser({ email: validLoginDto.email });
      // UsersService.findByEmail uses prisma.user.findUnique
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false for wrong password
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

      const response = await api.post(app, '/auth/login', {
        email: validLoginDto.email,
        password: 'wrong_password',
      });

      expectUnauthorized(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const mockUser = createMockUser({
        id: testUsers.user.id,
        email: testUsers.user.email,
      });

      ctx.prisma.user.update.mockResolvedValue(mockUser);

      const response = await api.post(app, '/auth/logout', {}, tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 401 without token', async () => {
      const response = await api.post(app, '/auth/logout');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 without refresh token', async () => {
      const response = await api.post(app, '/auth/refresh');

      expectUnauthorized(response);
    });

    it('should return 401 with access token instead of refresh token', async () => {
      // Using access token on refresh endpoint should fail
      // because it's protected by JwtRefreshGuard
      const response = await api.post(app, '/auth/refresh', {}, tokens.userToken);

      expectUnauthorized(response);
    });
  });
});
