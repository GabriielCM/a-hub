import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PointsTransactionType } from '@prisma/client';
import { PointsService } from './points.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  createMockUser,
  createMockPointsBalance,
  createMockPointsTransaction,
} from '../../test/factories';

describe('PointsService', () => {
  let service: PointsService;
  let prisma: jest.Mocked<PrismaService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockTransaction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        {
          provide: PrismaService,
          useValue: {
            pointsBalance: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            pointsTransaction: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: mockTransaction,
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyPointsReceived: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
    prisma = module.get(PrismaService);
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    const userId = 'user-1';

    it('should return existing balance', async () => {
      const mockBalance = {
        ...createMockPointsBalance({ userId, balance: 500 }),
        user: { id: userId, email: 'test@test.com', name: 'Test User' },
      };

      prisma.pointsBalance.findUnique.mockResolvedValue(mockBalance);

      const result = await service.getBalance(userId);

      expect(result.balance).toBe(500);
      expect(result.user).toBeDefined();
    });

    it('should create balance with 0 if not exists', async () => {
      const mockUser = createMockUser({ id: userId });
      const newBalance = {
        ...createMockPointsBalance({ userId, balance: 0 }),
        user: { id: userId, email: mockUser.email, name: mockUser.name },
      };

      prisma.pointsBalance.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.pointsBalance.create.mockResolvedValue(newBalance);

      const result = await service.getBalance(userId);

      expect(prisma.pointsBalance.create).toHaveBeenCalled();
      expect(result.balance).toBe(0);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.pointsBalance.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getBalance(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getBalance(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getHistory', () => {
    const userId = 'user-1';

    it('should return transaction history', async () => {
      const mockBalance = createMockPointsBalance({ userId });
      const mockTransactions = [
        createMockPointsTransaction({ pointsBalanceId: mockBalance.id }),
        createMockPointsTransaction({ pointsBalanceId: mockBalance.id }),
      ];

      prisma.pointsBalance.findUnique.mockResolvedValue(mockBalance);
      prisma.pointsTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getHistory(userId);

      expect(result).toHaveLength(2);
    });

    it('should return empty array if no balance record exists', async () => {
      prisma.pointsBalance.findUnique.mockResolvedValue(null);

      const result = await service.getHistory(userId);

      expect(result).toEqual([]);
    });
  });

  describe('transfer', () => {
    const fromUserId = 'user-1';
    const toUserId = 'user-2';

    it('should transfer points successfully', async () => {
      const senderBalance = {
        ...createMockPointsBalance({ userId: fromUserId, balance: 500 }),
        user: { id: fromUserId, email: 'sender@test.com', name: 'Sender' },
      };
      const recipientBalance = {
        ...createMockPointsBalance({ userId: toUserId, balance: 100 }),
        user: { id: toUserId, email: 'recipient@test.com', name: 'Recipient' },
      };
      const recipientUser = createMockUser({ id: toUserId, name: 'Recipient' });

      prisma.user.findUnique.mockResolvedValue(recipientUser);
      prisma.pointsBalance.findUnique
        .mockResolvedValueOnce(senderBalance)
        .mockResolvedValueOnce(recipientBalance);

      mockTransaction.mockResolvedValue({
        senderBalance: 400,
        recipientBalance: 200,
        outTransaction: createMockPointsTransaction({
          type: PointsTransactionType.TRANSFER_OUT,
          amount: -100,
        }),
        inTransaction: createMockPointsTransaction({
          type: PointsTransactionType.TRANSFER_IN,
          amount: 100,
        }),
      });

      const result = await service.transfer(fromUserId, {
        toUserId,
        amount: 100,
        description: 'Test transfer',
      });

      expect(result.message).toBe('Transfer completed successfully');
      expect(result.senderBalance).toBe(400);
      expect(result.recipientBalance).toBe(200);
    });

    it('should throw BadRequestException when transferring to self', async () => {
      await expect(
        service.transfer(fromUserId, {
          toUserId: fromUserId,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.transfer(fromUserId, {
          toUserId: fromUserId,
          amount: 100,
        }),
      ).rejects.toThrow('Cannot transfer points to yourself');
    });

    it('should throw NotFoundException if recipient not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.transfer(fromUserId, {
          toUserId,
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.transfer(fromUserId, {
          toUserId,
          amount: 100,
        }),
      ).rejects.toThrow('Recipient user not found');
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const senderBalance = {
        ...createMockPointsBalance({ userId: fromUserId, balance: 50 }),
        user: { id: fromUserId, email: 'sender@test.com', name: 'Sender' },
      };
      const recipientUser = createMockUser({ id: toUserId });

      prisma.user.findUnique.mockResolvedValue(recipientUser);
      prisma.pointsBalance.findUnique.mockResolvedValue(senderBalance);

      await expect(
        service.transfer(fromUserId, {
          toUserId,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.transfer(fromUserId, {
          toUserId,
          amount: 100,
        }),
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('adjust', () => {
    const userId = 'user-1';
    const adminId = 'admin-1';

    it('should add points successfully', async () => {
      const userBalance = {
        ...createMockPointsBalance({ userId, balance: 100 }),
        user: { id: userId, email: 'user@test.com', name: 'User' },
      };

      prisma.pointsBalance.findUnique.mockResolvedValue(userBalance);

      mockTransaction.mockResolvedValue({
        balance: { ...userBalance, balance: 200 },
        transaction: createMockPointsTransaction({
          type: PointsTransactionType.ADJUSTMENT,
          amount: 100,
        }),
      });

      const result = await service.adjust(
        userId,
        { amount: 100, reason: 'Bonus' },
        adminId,
      );

      expect(result.message).toBe('Points added successfully');
    });

    it('should deduct points successfully', async () => {
      const userBalance = {
        ...createMockPointsBalance({ userId, balance: 100 }),
        user: { id: userId, email: 'user@test.com', name: 'User' },
      };

      prisma.pointsBalance.findUnique.mockResolvedValue(userBalance);

      mockTransaction.mockResolvedValue({
        balance: { ...userBalance, balance: 50 },
        transaction: createMockPointsTransaction({
          type: PointsTransactionType.ADJUSTMENT,
          amount: -50,
        }),
      });

      const result = await service.adjust(
        userId,
        { amount: -50, reason: 'Penalty' },
        adminId,
      );

      expect(result.message).toBe('Points deducted successfully');
    });

    it('should throw BadRequestException for zero amount', async () => {
      await expect(
        service.adjust(userId, { amount: 0, reason: 'Invalid' }, adminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.adjust(userId, { amount: 0, reason: 'Invalid' }, adminId),
      ).rejects.toThrow('Adjustment amount cannot be zero');
    });

    it('should throw BadRequestException if result would be negative', async () => {
      const userBalance = {
        ...createMockPointsBalance({ userId, balance: 50 }),
        user: { id: userId, email: 'user@test.com', name: 'User' },
      };

      prisma.pointsBalance.findUnique.mockResolvedValue(userBalance);

      await expect(
        service.adjust(userId, { amount: -100, reason: 'Too much' }, adminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.adjust(userId, { amount: -100, reason: 'Too much' }, adminId),
      ).rejects.toThrow('Adjustment would result in negative balance');
    });
  });

  describe('getSystemSummary', () => {
    it('should return system totals', async () => {
      prisma.pointsBalance.aggregate.mockResolvedValue({
        _sum: { balance: 5000 },
        _count: 10,
        _avg: null,
        _min: null,
        _max: null,
      });

      const result = await service.getSystemSummary();

      expect(result.totalPoints).toBe(5000);
      expect(result.totalUsers).toBe(10);
    });

    it('should return 0 if no balances exist', async () => {
      prisma.pointsBalance.aggregate.mockResolvedValue({
        _sum: { balance: null },
        _count: 0,
        _avg: null,
        _min: null,
        _max: null,
      });

      const result = await service.getSystemSummary();

      expect(result.totalPoints).toBe(0);
      expect(result.totalUsers).toBe(0);
    });
  });
});
