import { INestApplication } from '@nestjs/common';
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
  expectNotFound,
  expectValidationError,
} from './helpers';
import {
  createMockCart,
  createMockCartItem,
  createMockStoreItem,
  createMockOrder,
} from '../factories';
import { createMockPointsBalance } from '../factories';
import { createMockUser } from '../factories';

describe('Cart E2E', () => {
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

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      ctx.prisma.cart.findUnique.mockResolvedValue(null);
      const newCart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [],
      };
      ctx.prisma.cart.create.mockResolvedValue(newCart);

      const response = await api.get(app, '/cart', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
      expect(response.body.totalPoints).toBe(0);
    });

    it('should return cart with items and total', async () => {
      const storeItem = createMockStoreItem({ pointsPrice: 100 });
      const cartItem = {
        ...createMockCartItem({ quantity: 2 }),
        storeItem,
      };
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [cartItem],
      };
      ctx.prisma.cart.findUnique.mockResolvedValue(cart);

      const response = await api.get(app, '/cart', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(1);
      expect(response.body.totalPoints).toBe(200); // 100 * 2
    });

    it('should return 401 without auth', async () => {
      const response = await api.get(app, '/cart');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add item to cart', async () => {
      const storeItem = createMockStoreItem({ id: 'item-1', stock: 10 });
      const cart = createMockCart({ userId: testUsers.user.id });
      const cartItemWithStoreItem = {
        ...createMockCartItem({ cartId: cart.id, storeItemId: 'item-1' }),
        storeItem,
      };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(storeItem);
      ctx.prisma.cart.findUnique
        .mockResolvedValueOnce(cart) // addToCart
        .mockResolvedValueOnce({ ...cart, items: [cartItemWithStoreItem] }); // getCart
      ctx.prisma.cartItem.findUnique.mockResolvedValue(null);
      ctx.prisma.cartItem.create.mockResolvedValue(cartItemWithStoreItem);

      const response = await api.post(
        app,
        '/cart/items',
        { storeItemId: 'item-1', quantity: 1 },
        tokens.userToken,
      );

      expect(response.status).toBe(201);
    });

    it('should increment quantity if item already in cart', async () => {
      const storeItem = createMockStoreItem({ id: 'item-1', stock: 10 });
      const cart = createMockCart({ userId: testUsers.user.id });
      const existingCartItem = {
        ...createMockCartItem({ cartId: cart.id, storeItemId: 'item-1', quantity: 1 }),
        storeItem,
      };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(storeItem);
      ctx.prisma.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce({ ...cart, items: [{ ...existingCartItem, quantity: 2 }] });
      ctx.prisma.cartItem.findUnique.mockResolvedValue(existingCartItem);
      ctx.prisma.cartItem.update.mockResolvedValue({ ...existingCartItem, quantity: 2 });

      const response = await api.post(
        app,
        '/cart/items',
        { storeItemId: 'item-1', quantity: 1 },
        tokens.userToken,
      );

      expect(response.status).toBe(201);
    });

    it('should return 404 for non-existent store item', async () => {
      ctx.prisma.storeItem.findUnique.mockResolvedValue(null);

      const response = await api.post(
        app,
        '/cart/items',
        { storeItemId: 'non-existent', quantity: 1 },
        tokens.userToken,
      );

      expectNotFound(response);
    });

    it('should return 400 for out of stock item', async () => {
      const storeItem = createMockStoreItem({ id: 'item-1', stock: 0 });
      ctx.prisma.storeItem.findUnique.mockResolvedValue(storeItem);

      const response = await api.post(
        app,
        '/cart/items',
        { storeItemId: 'item-1', quantity: 1 },
        tokens.userToken,
      );

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await api.post(app, '/cart/items', {
        storeItemId: 'item-1',
        quantity: 1,
      });

      expectUnauthorized(response);
    });
  });

  describe('PATCH /api/cart/items/:itemId', () => {
    it('should update cart item quantity', async () => {
      const storeItem = createMockStoreItem({ id: 'item-1', stock: 10 });
      const cartItem = createMockCartItem({ id: 'cart-item-1', storeItemId: 'item-1' });
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [cartItem],
      };

      ctx.prisma.cart.findUnique
        .mockResolvedValueOnce(cart) // updateCartItem
        .mockResolvedValueOnce({ ...cart, items: [{ ...cartItem, quantity: 3, storeItem }] }); // getCart
      ctx.prisma.storeItem.findUnique.mockResolvedValue(storeItem);
      ctx.prisma.cartItem.update.mockResolvedValue({ ...cartItem, quantity: 3 });

      const response = await api.patch(
        app,
        '/cart/items/cart-item-1',
        { quantity: 3 },
        tokens.userToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent cart item', async () => {
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [],
      };
      ctx.prisma.cart.findUnique.mockResolvedValue(cart);

      const response = await api.patch(
        app,
        '/cart/items/non-existent',
        { quantity: 2 },
        tokens.userToken,
      );

      expectNotFound(response);
    });

    it('should return 400 for quantity less than 1', async () => {
      const response = await api.patch(
        app,
        '/cart/items/cart-item-1',
        { quantity: 0 },
        tokens.userToken,
      );

      expectValidationError(response);
    });

    it('should return 401 without auth', async () => {
      const response = await api.patch(app, '/cart/items/cart-item-1', { quantity: 2 });

      expectUnauthorized(response);
    });
  });

  describe('DELETE /api/cart/items/:itemId', () => {
    it('should remove item from cart', async () => {
      const storeItem = createMockStoreItem();
      const cartItem = createMockCartItem({ id: 'cart-item-1' });
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [cartItem],
      };

      ctx.prisma.cart.findUnique
        .mockResolvedValueOnce(cart) // removeFromCart
        .mockResolvedValueOnce({ ...cart, items: [] }); // getCart
      ctx.prisma.cartItem.delete.mockResolvedValue(cartItem);

      const response = await api.delete(
        app,
        '/cart/items/cart-item-1',
        tokens.userToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it('should return 404 for non-existent cart item', async () => {
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [],
      };
      ctx.prisma.cart.findUnique.mockResolvedValue(cart);

      const response = await api.delete(
        app,
        '/cart/items/non-existent',
        tokens.userToken,
      );

      expectNotFound(response);
    });

    it('should return 401 without auth', async () => {
      const response = await api.delete(app, '/cart/items/cart-item-1');

      expectUnauthorized(response);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear all items from cart', async () => {
      const storeItem = createMockStoreItem();
      const cartItem = { ...createMockCartItem(), storeItem };
      const cart = createMockCart({ userId: testUsers.user.id });

      ctx.prisma.cart.findUnique
        .mockResolvedValueOnce(cart) // clearCart
        .mockResolvedValueOnce({ ...cart, items: [] }); // getCart
      ctx.prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const response = await api.delete(app, '/cart', tokens.userToken);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it('should return 401 without auth', async () => {
      const response = await api.delete(app, '/cart');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/cart/checkout', () => {
    it('should process checkout successfully', async () => {
      const storeItem = createMockStoreItem({ id: 'item-1', pointsPrice: 50, stock: 10 });
      const cartItem = {
        ...createMockCartItem({ storeItemId: 'item-1', quantity: 2 }),
        storeItem,
      };
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [cartItem],
      };
      const pointsBalance = {
        ...createMockPointsBalance({ userId: testUsers.user.id, balance: 500 }),
      };
      const order = createMockOrder({ userId: testUsers.user.id, totalPoints: 100 });

      ctx.prisma.cart.findUnique.mockResolvedValue(cart);
      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(pointsBalance);
      ctx.prisma.storeItem.findUnique.mockResolvedValue(storeItem);
      ctx.prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(ctx.prisma);
      });
      ctx.prisma.order.create.mockResolvedValue(order);
      ctx.prisma.orderItem.create.mockResolvedValue({});
      ctx.prisma.pointsBalance.update.mockResolvedValue({ ...pointsBalance, balance: 400 });
      ctx.prisma.pointsTransaction.create.mockResolvedValue({});
      ctx.prisma.storeItem.update.mockResolvedValue({ ...storeItem, stock: 8 });
      ctx.prisma.stockMovement.create.mockResolvedValue({});
      ctx.prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      ctx.prisma.order.update.mockResolvedValue({
        ...order,
        status: 'COMPLETED',
        items: [{ ...cartItem, pointsPrice: 50 }],
        user: { id: testUsers.user.id, email: 'test@test.com', name: 'Test' },
      });

      const response = await api.post(app, '/cart/checkout', {}, tokens.userToken);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Order completed successfully');
    });

    it('should return 400 for empty cart', async () => {
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [],
      };
      ctx.prisma.cart.findUnique.mockResolvedValue(cart);

      const response = await api.post(app, '/cart/checkout', {}, tokens.userToken);

      expect(response.status).toBe(400);
    });

    it('should return 400 for insufficient balance', async () => {
      const storeItem = createMockStoreItem({ pointsPrice: 500, stock: 10 });
      const cartItem = {
        ...createMockCartItem({ quantity: 1 }),
        storeItem,
      };
      const cart = {
        ...createMockCart({ userId: testUsers.user.id }),
        items: [cartItem],
      };
      const pointsBalance = createMockPointsBalance({
        userId: testUsers.user.id,
        balance: 100, // Insufficient
      });

      ctx.prisma.cart.findUnique.mockResolvedValue(cart);
      ctx.prisma.pointsBalance.findUnique.mockResolvedValue(pointsBalance);

      const response = await api.post(app, '/cart/checkout', {}, tokens.userToken);

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await api.post(app, '/cart/checkout');

      expectUnauthorized(response);
    });
  });
});
