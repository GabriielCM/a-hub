import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockCart,
  createMockCartItem,
  createMockStoreItem,
  createMockUser,
} from '../../test/factories';
import { createMockPointsBalance } from '../../test/factories/points.factory';

describe('CartService', () => {
  let service: CartService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTransaction = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            cartItem: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            storeItem: {
              findUnique: jest.fn(),
            },
            pointsBalance: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    const userId = 'user-1';

    it('should return existing cart with total points', async () => {
      const mockStoreItem = createMockStoreItem({ pointsPrice: 50 });
      const mockCartItem = {
        ...createMockCartItem({ quantity: 2 }),
        storeItem: mockStoreItem,
      };
      const mockCart = {
        ...createMockCart({ userId }),
        items: [mockCartItem],
      };

      prisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getCart(userId);

      expect(result.totalPoints).toBe(100); // 50 * 2
      expect(result.itemCount).toBe(1);
    });

    it('should create new cart if not exists', async () => {
      const emptyCart = { ...createMockCart({ userId }), items: [] };

      prisma.cart.findUnique.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(emptyCart);

      const result = await service.getCart(userId);

      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { userId },
        include: expect.any(Object),
      });
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('addToCart', () => {
    const userId = 'user-1';
    const storeItemId = 'store-item-1';

    it('should add new item to cart', async () => {
      const mockStoreItem = createMockStoreItem({ id: storeItemId, stock: 10 });
      const mockCart = createMockCart({ userId });
      const mockCartWithItems = { ...mockCart, items: [] };

      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);
      prisma.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCartWithItems);
      prisma.cartItem.findUnique.mockResolvedValue(null);
      prisma.cartItem.create.mockResolvedValue(createMockCartItem());

      const result = await service.addToCart(userId, { storeItemId, quantity: 2 });

      expect(prisma.cartItem.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should increment quantity if item already in cart', async () => {
      const mockStoreItem = createMockStoreItem({ id: storeItemId, stock: 10 });
      const existingCartItem = createMockCartItem({
        storeItemId,
        quantity: 2,
      });
      const mockCart = createMockCart({ userId });
      const mockCartWithItems = { ...mockCart, items: [] };

      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);
      prisma.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCartWithItems);
      prisma.cartItem.findUnique.mockResolvedValue(existingCartItem);
      prisma.cartItem.update.mockResolvedValue({
        ...existingCartItem,
        quantity: 4,
      });

      await service.addToCart(userId, { storeItemId, quantity: 2 });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: existingCartItem.id },
        data: { quantity: 4 },
      });
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const mockStoreItem = createMockStoreItem({ id: storeItemId, stock: 2 });
      const mockCart = createMockCart({ userId });

      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addToCart(userId, { storeItemId, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if store item not found', async () => {
      prisma.storeItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addToCart(userId, { storeItemId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if store item is not active', async () => {
      const inactiveItem = createMockStoreItem({
        id: storeItemId,
        isActive: false,
      });

      prisma.storeItem.findUnique.mockResolvedValue(inactiveItem);

      await expect(
        service.addToCart(userId, { storeItemId, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCartItem', () => {
    const userId = 'user-1';
    const itemId = 'cart-item-1';

    it('should update cart item quantity', async () => {
      const mockStoreItem = createMockStoreItem({ stock: 10 });
      const mockCartItem = createMockCartItem({
        id: itemId,
        storeItemId: mockStoreItem.id,
      });
      const mockCart = { ...createMockCart({ userId }), items: [mockCartItem] };
      const updatedCart = { ...mockCart, items: [] };

      prisma.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(updatedCart);
      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);
      prisma.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 5 });

      const result = await service.updateCartItem(userId, itemId, { quantity: 5 });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { quantity: 5 },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCartItem(userId, itemId, { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      const mockCart = { ...createMockCart({ userId }), items: [] };

      prisma.cart.findUnique.mockResolvedValue(mockCart);

      await expect(
        service.updateCartItem(userId, itemId, { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromCart', () => {
    const userId = 'user-1';
    const itemId = 'cart-item-1';

    it('should remove item from cart', async () => {
      const mockCartItem = createMockCartItem({ id: itemId });
      const mockCart = { ...createMockCart({ userId }), items: [mockCartItem] };
      const emptyCart = { ...mockCart, items: [] };

      prisma.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(emptyCart);
      prisma.cartItem.delete.mockResolvedValue(mockCartItem);

      const result = await service.removeFromCart(userId, itemId);

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: itemId },
      });
      expect(result).toBeDefined();
    });
  });

  describe('clearCart', () => {
    const userId = 'user-1';

    it('should clear all items from cart', async () => {
      const mockCart = createMockCart({ userId });
      const emptyCart = { ...mockCart, items: [] };

      prisma.cart.findUnique
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(emptyCart);
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.clearCart(userId);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockCart.id },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.clearCart(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkout', () => {
    const userId = 'user-1';

    it('should process checkout successfully', async () => {
      const mockStoreItem = createMockStoreItem({ pointsPrice: 50, stock: 10 });
      const mockCartItem = {
        ...createMockCartItem({ quantity: 2, storeItemId: mockStoreItem.id }),
        storeItem: mockStoreItem,
      };
      const mockCart = {
        ...createMockCart({ userId }),
        items: [mockCartItem],
      };
      const mockPointsBalance = createMockPointsBalance({
        userId,
        balance: 500,
      });

      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.pointsBalance.findUnique.mockResolvedValue(mockPointsBalance);
      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);

      const mockOrder = {
        id: 'order-1',
        userId,
        totalPoints: 100,
        status: 'COMPLETED',
        items: [],
        user: { id: userId, email: 'test@test.com', name: 'Test User' },
      };

      mockTransaction.mockResolvedValue(mockOrder);

      const result = await service.checkout(userId);

      expect(result.message).toBe('Order completed successfully');
      expect(result.order).toBeDefined();
    });

    it('should throw BadRequestException for empty cart', async () => {
      const emptyCart = { ...createMockCart({ userId }), items: [] };

      prisma.cart.findUnique.mockResolvedValue(emptyCart);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
      await expect(service.checkout(userId)).rejects.toThrow('Cart is empty');
    });

    it('should throw BadRequestException for insufficient points', async () => {
      const mockStoreItem = createMockStoreItem({ pointsPrice: 500, stock: 10 });
      const mockCartItem = {
        ...createMockCartItem({ quantity: 2, storeItemId: mockStoreItem.id }),
        storeItem: mockStoreItem,
      };
      const mockCart = {
        ...createMockCart({ userId }),
        items: [mockCartItem],
      };
      const mockPointsBalance = createMockPointsBalance({
        userId,
        balance: 100, // Not enough
      });

      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.pointsBalance.findUnique.mockResolvedValue(mockPointsBalance);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
      await expect(service.checkout(userId)).rejects.toThrow(
        'Insufficient points balance',
      );
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const mockStoreItem = createMockStoreItem({
        pointsPrice: 50,
        stock: 1, // Only 1 in stock
      });
      const mockCartItem = {
        ...createMockCartItem({ quantity: 5, storeItemId: mockStoreItem.id }),
        storeItem: mockStoreItem,
      };
      const mockCart = {
        ...createMockCart({ userId }),
        items: [mockCartItem],
      };
      const mockPointsBalance = createMockPointsBalance({
        userId,
        balance: 500,
      });

      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.pointsBalance.findUnique.mockResolvedValue(mockPointsBalance);
      prisma.storeItem.findUnique.mockResolvedValue(mockStoreItem);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
      await expect(service.checkout(userId)).rejects.toThrow('Insufficient stock');
    });
  });
});
