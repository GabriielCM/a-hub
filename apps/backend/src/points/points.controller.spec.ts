import { Test, TestingModule } from '@nestjs/testing';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { createMockPointsBalance, createMockPointsTransaction } from '../../test/factories';

describe('PointsController', () => {
  let controller: PointsController;
  let pointsService: jest.Mocked<PointsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: {
            getBalance: jest.fn(),
            getHistory: jest.fn(),
            transfer: jest.fn(),
            adjust: jest.fn(),
            getAdminTransactions: jest.fn(),
            getAdminBalances: jest.fn(),
            getSystemSummary: jest.fn(),
            exportTransactionsCsv: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PointsController>(PointsController);
    pointsService = module.get(PointsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /points/balance', () => {
    it('should return user balance', async () => {
      const mockBalance = {
        ...createMockPointsBalance({ userId: 'user-1', balance: 500 }),
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
      };
      pointsService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('user-1');

      expect(pointsService.getBalance).toHaveBeenCalledWith('user-1');
      expect(result.balance).toBe(500);
    });
  });

  describe('GET /points/history', () => {
    it('should return transaction history', async () => {
      const mockHistory = [
        createMockPointsTransaction(),
        createMockPointsTransaction(),
      ];
      pointsService.getHistory.mockResolvedValue(mockHistory);

      const result = await controller.getHistory('user-1');

      expect(pointsService.getHistory).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('POST /points/transfer', () => {
    it('should transfer points to another user', async () => {
      const transferDto = { toUserId: 'user-2', amount: 100, description: 'Test' };
      const mockResult = {
        message: 'Transfer completed successfully',
        senderBalance: 400,
        recipientBalance: 200,
      };
      pointsService.transfer.mockResolvedValue(mockResult);

      const result = await controller.transfer('user-1', transferDto);

      expect(pointsService.transfer).toHaveBeenCalledWith('user-1', transferDto);
      expect(result.message).toBe('Transfer completed successfully');
    });
  });

  describe('POST /points/adjust/:userId', () => {
    it('should adjust user points (admin)', async () => {
      const adjustDto = { amount: 100, reason: 'Bonus' };
      const mockResult = {
        message: 'Points added successfully',
        newBalance: 600,
      };
      pointsService.adjust.mockResolvedValue(mockResult);

      const result = await controller.adjust('user-1', adjustDto, 'admin-1');

      expect(pointsService.adjust).toHaveBeenCalledWith('user-1', adjustDto, 'admin-1');
      expect(result.message).toBe('Points added successfully');
    });
  });

  describe('GET /points/admin/transactions', () => {
    it('should return all transactions for admin', async () => {
      const mockTransactions = [
        createMockPointsTransaction(),
        createMockPointsTransaction(),
      ];
      pointsService.getAdminTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getAdminTransactions({});

      expect(pointsService.getAdminTransactions).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /points/admin/balances', () => {
    it('should return all user balances for admin', async () => {
      const mockBalances = [
        { ...createMockPointsBalance(), user: {} },
        { ...createMockPointsBalance(), user: {} },
      ];
      pointsService.getAdminBalances.mockResolvedValue(mockBalances);

      const result = await controller.getAdminBalances();

      expect(pointsService.getAdminBalances).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /points/admin/summary', () => {
    it('should return system summary for admin', async () => {
      const mockSummary = { totalPoints: 5000, totalUsers: 10 };
      pointsService.getSystemSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSystemSummary();

      expect(pointsService.getSystemSummary).toHaveBeenCalled();
      expect(result.totalPoints).toBe(5000);
    });
  });

  describe('GET /points/admin/export', () => {
    it('should export transactions to CSV', async () => {
      const csvContent = 'Data,Usuario,Tipo,Valor,Descricao';
      pointsService.exportTransactionsCsv.mockResolvedValue(csvContent);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportCsv({}, mockResponse as any);

      expect(pointsService.exportTransactionsCsv).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });
  });
});
