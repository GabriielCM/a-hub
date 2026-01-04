import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  resetTestState,
  generateTestTokens,
  TestContext,
  TestTokens,
} from '../e2e-setup';
import {
  api,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  expectValidationError,
} from './helpers';
import { createMockStoreItem } from '../factories';

describe('Store E2E', () => {
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

  describe('GET /api/store/items', () => {
    it('should list available items (public)', async () => {
      const mockItems = [
        createMockStoreItem({ isActive: true, stock: 10 }),
        createMockStoreItem({ isActive: true, stock: 5 }),
      ];
      ctx.prisma.storeItem.findMany.mockResolvedValue(mockItems);

      const response = await api.get(app, '/store/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return empty array when no items available', async () => {
      ctx.prisma.storeItem.findMany.mockResolvedValue([]);

      const response = await api.get(app, '/store/items');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/store/items/:id', () => {
    it('should return item details', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1' });
      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);

      const response = await api.get(app, '/store/items/item-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('item-1');
      expect(response.body.name).toBeDefined();
    });

    it('should return 404 for non-existent item', async () => {
      ctx.prisma.storeItem.findUnique.mockResolvedValue(null);

      const response = await api.get(app, '/store/items/non-existent');

      expectNotFound(response);
    });
  });

  describe('POST /api/store/items', () => {
    const validItemData = {
      name: 'New Item',
      pointsPrice: 100,
      stock: 50,
      description: 'A new store item',
    };

    it('should create item as admin', async () => {
      const mockItem = createMockStoreItem(validItemData);
      ctx.prisma.storeItem.create.mockResolvedValue(mockItem);

      const response = await api.post(
        app,
        '/store/items',
        validItemData,
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Item');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.post(
        app,
        '/store/items',
        validItemData,
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.post(app, '/store/items', validItemData);

      expectUnauthorized(response);
    });

    it('should return 400 for missing name', async () => {
      const response = await api.post(
        app,
        '/store/items',
        { pointsPrice: 100, stock: 10 },
        tokens.adminToken,
      );

      expectValidationError(response);
    });

    it('should return 400 for missing pointsPrice', async () => {
      const response = await api.post(
        app,
        '/store/items',
        { name: 'Test Item', stock: 10 },
        tokens.adminToken,
      );

      expectValidationError(response);
    });
  });

  describe('PATCH /api/store/items/:id', () => {
    it('should update item as admin', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1' });
      const updatedItem = { ...mockItem, name: 'Updated Item' };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.storeItem.update.mockResolvedValue(updatedItem);

      const response = await api.patch(
        app,
        '/store/items/item-1',
        { name: 'Updated Item' },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Item');
    });

    it('should update item price', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1', pointsPrice: 50 });
      const updatedItem = { ...mockItem, pointsPrice: 75 };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.storeItem.update.mockResolvedValue(updatedItem);

      const response = await api.patch(
        app,
        '/store/items/item-1',
        { pointsPrice: 75 },
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.pointsPrice).toBe(75);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.patch(
        app,
        '/store/items/item-1',
        { name: 'Updated Item' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.patch(app, '/store/items/item-1', {
        name: 'Updated Item',
      });

      expectUnauthorized(response);
    });
  });

  describe('DELETE /api/store/items/:id', () => {
    it('should soft delete item as admin', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1', isActive: true });
      const deletedItem = { ...mockItem, isActive: false };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.storeItem.update.mockResolvedValue(deletedItem);

      const response = await api.delete(
        app,
        '/store/items/item-1',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.delete(
        app,
        '/store/items/item-1',
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.delete(app, '/store/items/item-1');

      expectUnauthorized(response);
    });
  });

  describe('POST /api/store/items/:id/stock', () => {
    it('should adjust stock (positive - entry)', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1', stock: 10 });
      const updatedItem = { ...mockItem, stock: 20 };
      const mockMovement = {
        id: 'movement-1',
        storeItemId: 'item-1',
        quantity: 10,
        type: 'ENTRY',
        reason: 'Stock replenishment',
        createdAt: new Date(),
      };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.storeItem.update.mockResolvedValue(updatedItem);
      ctx.prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const response = await api.post(
        app,
        '/store/items/item-1/stock',
        { quantity: 10, reason: 'Stock replenishment' },
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
    });

    it('should adjust stock (negative - exit)', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1', stock: 20 });
      const updatedItem = { ...mockItem, stock: 15 };
      const mockMovement = {
        id: 'movement-1',
        storeItemId: 'item-1',
        quantity: -5,
        type: 'EXIT',
        reason: 'Manual adjustment',
        createdAt: new Date(),
      };

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.storeItem.update.mockResolvedValue(updatedItem);
      ctx.prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const response = await api.post(
        app,
        '/store/items/item-1/stock',
        { quantity: -5, reason: 'Manual adjustment' },
        tokens.adminToken,
      );

      expect(response.status).toBe(201);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.post(
        app,
        '/store/items/item-1/stock',
        { quantity: 10, reason: 'Test' },
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.post(app, '/store/items/item-1/stock', {
        quantity: 10,
        reason: 'Test',
      });

      expectUnauthorized(response);
    });
  });

  describe('GET /api/store/items/:id/stock-history', () => {
    it('should return stock movements as admin', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1' });
      const mockMovements = [
        {
          id: 'movement-1',
          storeItemId: 'item-1',
          quantity: 10,
          type: 'ENTRY',
          reason: 'Initial stock',
          createdAt: new Date(),
        },
        {
          id: 'movement-2',
          storeItemId: 'item-1',
          quantity: -2,
          type: 'EXIT',
          reason: 'Sale',
          createdAt: new Date(),
        },
      ];

      ctx.prisma.storeItem.findUnique.mockResolvedValue(mockItem);
      ctx.prisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const response = await api.get(
        app,
        '/store/items/item-1/stock-history',
        tokens.adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await api.get(
        app,
        '/store/items/item-1/stock-history',
        tokens.userToken,
      );

      expectForbidden(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await api.get(app, '/store/items/item-1/stock-history');

      expectUnauthorized(response);
    });
  });
});
