import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoreService } from './store.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockStoreItem } from '../../test/factories';

describe('StoreService', () => {
  let service: StoreService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTransaction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: PrismaService,
          useValue: {
            storeItem: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            stockMovement: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a store item with initial stock movement', async () => {
      const createDto = {
        name: 'Test Item',
        description: 'A test item',
        pointsPrice: 100,
        stock: 50,
      };
      const mockItem = createMockStoreItem(createDto);

      mockTransaction.mockImplementation(async (callback) => {
        return callback({
          storeItem: { create: jest.fn().mockResolvedValue(mockItem) },
          stockMovement: { create: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.create(createDto);

      expect(mockTransaction).toHaveBeenCalled();
      expect(result.name).toBe(createDto.name);
    });

    it('should not create stock movement if stock is 0', async () => {
      const createDto = {
        name: 'Test Item',
        description: 'A test item',
        pointsPrice: 100,
        stock: 0,
      };
      const mockItem = createMockStoreItem(createDto);

      const stockMovementCreate = jest.fn();
      mockTransaction.mockImplementation(async (callback) => {
        return callback({
          storeItem: { create: jest.fn().mockResolvedValue(mockItem) },
          stockMovement: { create: stockMovementCreate },
        });
      });

      await service.create(createDto);

      expect(stockMovementCreate).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return active items with stock', async () => {
      const mockItems = [
        createMockStoreItem({ isActive: true, stock: 10 }),
        createMockStoreItem({ isActive: true, stock: 5 }),
      ];

      prisma.storeItem.findMany.mockResolvedValue(mockItems);

      const result = await service.findAll();

      expect(prisma.storeItem.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          stock: { gt: 0 },
          OR: [
            { offerEndsAt: null },
            { offerEndsAt: { gt: expect.any(Date) } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a store item by id', async () => {
      const mockItem = createMockStoreItem();

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);

      const result = await service.findOne(mockItem.id);

      expect(result.id).toBe(mockItem.id);
    });

    it('should throw NotFoundException if item not found', async () => {
      prisma.storeItem.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Store item not found',
      );
    });
  });

  describe('update', () => {
    it('should update a store item', async () => {
      const mockItem = createMockStoreItem();
      const updateDto = { name: 'Updated Item' };

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      prisma.storeItem.update.mockResolvedValue({ ...mockItem, ...updateDto });

      const result = await service.update(mockItem.id, updateDto);

      expect(result.name).toBe('Updated Item');
    });

    it('should throw NotFoundException if item not found', async () => {
      prisma.storeItem.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a store item', async () => {
      const mockItem = createMockStoreItem({ isActive: true });

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      prisma.storeItem.update.mockResolvedValue({ ...mockItem, isActive: false });

      const result = await service.remove(mockItem.id);

      expect(prisma.storeItem.update).toHaveBeenCalledWith({
        where: { id: mockItem.id },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('adjustStock', () => {
    it('should increase stock', async () => {
      const mockItem = createMockStoreItem({ stock: 10 });
      const adjustDto = { quantity: 5, reason: 'Restock' };

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      mockTransaction.mockImplementation(async (callback) => {
        return callback({
          stockMovement: { create: jest.fn().mockResolvedValue({}) },
          storeItem: {
            update: jest.fn().mockResolvedValue({ ...mockItem, stock: 15 }),
          },
        });
      });

      const result = await service.adjustStock(mockItem.id, adjustDto);

      expect(result.stock).toBe(15);
    });

    it('should decrease stock', async () => {
      const mockItem = createMockStoreItem({ stock: 10 });
      const adjustDto = { quantity: -5, reason: 'Sale adjustment' };

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      mockTransaction.mockImplementation(async (callback) => {
        return callback({
          stockMovement: { create: jest.fn().mockResolvedValue({}) },
          storeItem: {
            update: jest.fn().mockResolvedValue({ ...mockItem, stock: 5 }),
          },
        });
      });

      const result = await service.adjustStock(mockItem.id, adjustDto);

      expect(result.stock).toBe(5);
    });

    it('should throw BadRequestException if result would be negative', async () => {
      const mockItem = createMockStoreItem({ stock: 5 });

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);

      await expect(
        service.adjustStock(mockItem.id, { quantity: -10, reason: 'Too much' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.adjustStock(mockItem.id, { quantity: -10, reason: 'Too much' }),
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getStockHistory', () => {
    it('should return stock movement history', async () => {
      const mockItem = createMockStoreItem();
      const mockMovements = [
        { id: 'mov-1', storeItemId: mockItem.id, quantity: 10, reason: 'Initial', createdAt: new Date() },
        { id: 'mov-2', storeItemId: mockItem.id, quantity: -2, reason: 'Sale', createdAt: new Date() },
      ];

      prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      prisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.getStockHistory(mockItem.id);

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { storeItemId: mockItem.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });
});
