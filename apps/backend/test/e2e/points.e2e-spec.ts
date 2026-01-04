import { INestApplication } from '@nestjs/common';
import { PointsTransactionType } from '@prisma/client';
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
  createMockPointsBalance,
  createMockPointsTransaction,
  createMockUser,
} from '../factories';

describe('Points E2E', () => {
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

  describe('GET /api/points/balance', () => {
    it('should return user balance', async () => {
      const mockBalance = {
        ...createMockPointsBalance({
          userId: testUsers.user.id,
          balance: 500,
        }),
        user: { id: testUsers.user.id, email: testUsers.user.email, name: 'Test User' },
      };
      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(mockBalance);

      const response = await api.get(app, '/points/balance', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(500);
    });

    it('should create balance if not exists', async () => {
      const mockUser = createMockUser({ id: testUsers.user.id });
      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(null);
      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const newBalance = {
        ...createMockPointsBalance({
          userId: testUsers.user.id,
          balance: 0,
        }),
        user: { id: testUsers.user.id, email: mockUser.email, name: mockUser.name },
      };
      ctx.prisma.pointsBalance.create.mockResolvedValue(newBalance);

      const response = await api.get(app, '/points/balance', tokens.userToken);

      expect(response.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/points/balance');

      expectUnauthorized(response);
    });
  });

  describe('GET /api/points/history', () => {
    it('should return transaction history', async () => {
      const mockBalance = createMockPointsBalance({ userId: testUsers.user.id });
      const mockTransactions = [
        createMockPointsTransaction({ pointsBalanceId: mockBalance.id }),
      ];

      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(mockBalance);
      ctx.prisma.pointsTransaction.findMany.mockResolvedValue(mockTransactions);

      const response = await api.get(app, '/points/history', tokens.userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/points/history');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/points/transfer', () => {
    it('should transfer points to another user', async () => {
      const senderBalance = {
        ...createMockPointsBalance({
          userId: testUsers.user.id,
          balance: 1000,
        }),
        user: { id: testUsers.user.id, email: testUsers.user.email, name: 'Sender User' },
      };
      const recipientUser = createMockUser({ id: 'recipient-id', name: 'Recipient User' });
      const recipientBalance = {
        ...createMockPointsBalance({
          userId: 'recipient-id',
          balance: 0,
        }),
        user: { id: 'recipient-id', email: recipientUser.email, name: recipientUser.name },
      };

      // First findUnique is for sender balance, second is for recipient balance after getBalance
      ctx.prisma.pointsBalance.findUnique
        .mockResolvedValueOnce(senderBalance) // getBalance for sender
        .mockResolvedValueOnce(recipientBalance); // getBalance for recipient
      ctx.prisma.user.findUnique.mockResolvedValue(recipientUser);
      ctx.prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(ctx.prisma);
      });
      ctx.prisma.pointsBalance.update.mockResolvedValue({
        ...senderBalance,
        balance: 900,
      });
      ctx.prisma.pointsTransaction.create.mockResolvedValue(
        createMockPointsTransaction(),
      );

      const response = await api.post(
        app,
        '/points/transfer',
        { toUserId: 'recipient-id', amount: 100 },
        tokens.userToken,
      );

      expect(response.status).toBe(201);
    });

    it('should return 400 for insufficient balance', async () => {
      const senderBalance = {
        ...createMockPointsBalance({
          userId: testUsers.user.id,
          balance: 50,
        }),
        user: { id: testUsers.user.id, email: testUsers.user.email, name: 'Sender User' },
      };
      const recipientUser = createMockUser({ id: 'recipient-id' });

      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(senderBalance);
      ctx.prisma.user.findUnique.mockResolvedValue(recipientUser);

      const response = await api.post(
        app,
        '/points/transfer',
        { toUserId: 'recipient-id', amount: 100 },
        tokens.userToken,
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 for negative amount', async () => {
      const response = await api.post(
        app,
        '/points/transfer',
        { toUserId: 'recipient-id', amount: -50 },
        tokens.userToken,
      );

      expectValidationError(response);
    });

    it('should return 404 for non-existent recipient', async () => {
      const senderBalance = createMockPointsBalance({
        userId: testUsers.user.id,
        balance: 1000,
      });

      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(senderBalance);
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const response = await api.post(
        app,
        '/points/transfer',
        { toUserId: 'non-existent', amount: 100 },
        tokens.userToken,
      );

      expectNotFound(response);
    });

    it('should return 401 without auth', async () => {
      const response = await api.post(app, '/points/transfer', {
        toUserId: 'recipient-id',
        amount: 100,
      });

      expectUnauthorized(response);
    });
  });

  describe('POST /api/points/adjust/:userId (Admin)', () => {
    it('should allow admin to credit points', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      const targetBalance = {
        ...createMockPointsBalance({
          userId: 'target-user',
          balance: 100,
        }),
        user: { id: 'target-user', email: targetUser.email, name: targetUser.name },
      };

      // getBalance first looks for pointsBalance
      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(targetBalance);
      ctx.prisma.user.findUnique.mockResolvedValue(targetUser);
      ctx.prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(ctx.prisma);
      });
      ctx.prisma.pointsBalance.update.mockResolvedValue({
        ...targetBalance,
        balance: 200,
      });
      ctx.prisma.pointsTransaction.create.mockResolvedValue(
        createMockPointsTransaction({ type: PointsTransactionType.ADJUSTMENT }),
      );

      const response = await api.post(
        app,
        '/points/adjust/target-user',
        { amount: 100, reason: 'Admin credit' },
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
    });

    it('should allow admin to debit points', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      const targetBalance = {
        ...createMockPointsBalance({
          userId: 'target-user',
          balance: 200,
        }),
        user: { id: 'target-user', email: targetUser.email, name: targetUser.name },
      };

      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(targetBalance);
      ctx.prisma.user.findUnique.mockResolvedValue(targetUser);
      ctx.prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(ctx.prisma);
      });
      ctx.prisma.pointsBalance.update.mockResolvedValue({
        ...targetBalance,
        balance: 100,
      });
      ctx.prisma.pointsTransaction.create.mockResolvedValue(
        createMockPointsTransaction({ type: PointsTransactionType.ADJUSTMENT }),
      );

      const response = await api.post(
        app,
        '/points/adjust/target-user',
        { amount: -100, reason: 'Admin debit' },
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.post(
        app,
        '/points/adjust/target-user',
        { amount: 100, reason: 'Test' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 404 for non-existent user', async () => {
      ctx.prisma.user.findUnique.mockResolvedValue(null);

      const response = await api.post(
        app,
        '/points/adjust/non-existent',
        { amount: 100, reason: 'Test' },
        tokens.adminToken,
      );

      expectNotFound(response);
    });
  });

  describe('GET /api/points/admin/transactions (Admin)', () => {
    it('should return all transactions for admin', async () => {
      const mockTransactions = [createMockPointsTransaction()];
      ctx.prisma.pointsTransaction.findMany.mockResolvedValue(mockTransactions);

      const response = await api.get(
        app,
        '/points/admin/transactions',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(
        app,
        '/points/admin/transactions',
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  describe('GET /api/points/admin/balances (Admin)', () => {
    it('should return all user balances for admin', async () => {
      const mockBalances = [createMockPointsBalance()];
      ctx.prisma.pointsBalance.findMany.mockResolvedValue(mockBalances);

      const response = await api.get(
        app,
        '/points/admin/balances',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(
        app,
        '/points/admin/balances',
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  describe('GET /api/points/admin/summary (Admin)', () => {
    it('should return system summary for admin', async () => {
      ctx.prisma.pointsBalance.aggregate.mockResolvedValue({
        _sum: { balance: 10000 },
        _count: 50,
      });

      const response = await api.get(
        app,
        '/points/admin/summary',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.totalPoints).toBe(10000);
      expect(response.body.totalUsers).toBe(50);
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(
        app,
        '/points/admin/summary',
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });

  describe('GET /api/points/admin/export (Admin)', () => {
    it('should return CSV for admin', async () => {
      const mockTransactions = [
        {
          ...createMockPointsTransaction(),
          pointsBalance: {
            id: 'balance-1',
            userId: 'user-1',
            user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
          },
        },
      ];
      ctx.prisma.pointsTransaction.findMany.mockResolvedValue(mockTransactions);

      const response = await api.get(
        app,
        '/points/admin/export',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should return 403 for non-admin', async () => {
      const response = await api.get(
        app,
        '/points/admin/export',
        tokens.userToken,
      );

      expectForbidden(response);
    });
  });
});
