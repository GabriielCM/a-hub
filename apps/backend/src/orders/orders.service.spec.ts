import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  const createMockOrder = (overrides = {}) => ({
    id: 'order-1',
    userId: 'user-1',
    totalPoints: 200,
    status: OrderStatus.COMPLETED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('should return orders for a specific user', async () => {
      const mockOrders = [
        { ...createMockOrder(), items: [] },
        { ...createMockOrder({ id: 'order-2' }), items: [] },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAllByUser('user-1');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return all orders with user data', async () => {
      const mockOrders = [
        { ...createMockOrder(), items: [], user: {} },
        { ...createMockOrder({ id: 'order-2', userId: 'user-2' }), items: [], user: {} },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return order for admin', async () => {
      const mockOrder = { ...createMockOrder({ userId: 'other-user' }), items: [], user: {} };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1', 'admin-1', Role.ADMIN);

      expect(result.id).toBe('order-1');
    });

    it('should return order for owner', async () => {
      const mockOrder = { ...createMockOrder({ userId: 'user-1' }), items: [], user: {} };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1', 'user-1', Role.COLLABORATOR);

      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'user-1', Role.COLLABORATOR)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if non-owner tries to access', async () => {
      const mockOrder = { ...createMockOrder({ userId: 'other-user' }), items: [], user: {} };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.findOne('order-1', 'user-1', Role.COLLABORATOR),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne('order-1', 'user-1', Role.COLLABORATOR),
      ).rejects.toThrow('You can only access your own orders');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = createMockOrder();
      const updatedOrder = { ...mockOrder, status: OrderStatus.DELIVERED, items: [], user: {} };

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', { status: OrderStatus.DELIVERED });

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.DELIVERED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
