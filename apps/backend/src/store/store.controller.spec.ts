import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { createMockStoreItem } from '../../test/factories';

describe('StoreController', () => {
  let controller: StoreController;
  let storeService: jest.Mocked<StoreService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            adjustStock: jest.fn(),
            getStockHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
    storeService = module.get(StoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /store/items', () => {
    it('should return all available store items', async () => {
      const mockItems = [createMockStoreItem(), createMockStoreItem()];
      storeService.findAll.mockResolvedValue(mockItems);

      const result = await controller.findAll();

      expect(storeService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /store/items/:id', () => {
    it('should return a store item by id', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1' });
      storeService.findOne.mockResolvedValue(mockItem);

      const result = await controller.findOne('item-1');

      expect(storeService.findOne).toHaveBeenCalledWith('item-1');
      expect(result.id).toBe('item-1');
    });
  });

  describe('POST /store/items', () => {
    it('should create a new store item', async () => {
      const createDto = {
        name: 'New Item',
        description: 'A new item',
        pointsPrice: 100,
        stock: 50,
      };
      const mockItem = createMockStoreItem(createDto);
      storeService.create.mockResolvedValue(mockItem);

      const result = await controller.create(createDto);

      expect(storeService.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('New Item');
    });
  });

  describe('PATCH /store/items/:id', () => {
    it('should update a store item', async () => {
      const updateDto = { name: 'Updated Item' };
      const mockItem = createMockStoreItem({ id: 'item-1', name: 'Updated Item' });
      storeService.update.mockResolvedValue(mockItem);

      const result = await controller.update('item-1', updateDto);

      expect(storeService.update).toHaveBeenCalledWith('item-1', updateDto);
      expect(result.name).toBe('Updated Item');
    });
  });

  describe('DELETE /store/items/:id', () => {
    it('should soft-delete a store item', async () => {
      const mockItem = createMockStoreItem({ id: 'item-1', isActive: false });
      storeService.remove.mockResolvedValue(mockItem);

      const result = await controller.remove('item-1');

      expect(storeService.remove).toHaveBeenCalledWith('item-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('POST /store/items/:id/stock', () => {
    it('should adjust stock for a store item', async () => {
      const adjustDto = { quantity: 10, reason: 'Restock' };
      const mockItem = createMockStoreItem({ id: 'item-1', stock: 60 });
      storeService.adjustStock.mockResolvedValue(mockItem);

      const result = await controller.adjustStock('item-1', adjustDto);

      expect(storeService.adjustStock).toHaveBeenCalledWith('item-1', adjustDto);
      expect(result.stock).toBe(60);
    });
  });

  describe('GET /store/items/:id/stock-history', () => {
    it('should return stock movement history', async () => {
      const mockHistory = [
        { id: 'mov-1', quantity: 50, reason: 'Initial stock', createdAt: new Date() },
        { id: 'mov-2', quantity: 10, reason: 'Restock', createdAt: new Date() },
      ];
      storeService.getStockHistory.mockResolvedValue(mockHistory);

      const result = await controller.getStockHistory('item-1');

      expect(storeService.getStockHistory).toHaveBeenCalledWith('item-1');
      expect(result).toHaveLength(2);
    });
  });
});
