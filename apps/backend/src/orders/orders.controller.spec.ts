import { Test, TestingModule } from '@nestjs/testing';
import { Role, OrderStatus } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const createMockOrder = (overrides = {}) => ({
    id: 'order-1',
    userId: 'user-1',
    totalPoints: 200,
    status: OrderStatus.COMPLETED,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findAllByUser: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return orders for current user', async () => {
      const mockOrders = [createMockOrder(), createMockOrder({ id: 'order-2' })];
      ordersService.findAllByUser.mockResolvedValue(mockOrders);

      const result = await controller.findAllByUser('user-1');

      expect(ordersService.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /orders/all', () => {
    it('should return all orders for admin', async () => {
      const mockOrders = [
        { ...createMockOrder(), user: {} },
        { ...createMockOrder({ id: 'order-2', userId: 'user-2' }), user: {} },
      ];
      ordersService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll();

      expect(ordersService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order by id', async () => {
      const mockOrder = { ...createMockOrder(), user: {} };
      ordersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('order-1', 'user-1', Role.COLLABORATOR);

      expect(ordersService.findOne).toHaveBeenCalledWith('order-1', 'user-1', Role.COLLABORATOR);
      expect(result.id).toBe('order-1');
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...createMockOrder(), status: OrderStatus.DELIVERED, user: {} };
      ordersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus('order-1', { status: OrderStatus.DELIVERED });

      expect(ordersService.updateStatus).toHaveBeenCalledWith('order-1', { status: OrderStatus.DELIVERED });
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });
  });
});
