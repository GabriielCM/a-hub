import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { createMockCart, createMockStoreItem } from '../../test/factories';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: {
            getCart: jest.fn(),
            addToCart: jest.fn(),
            updateCartItem: jest.fn(),
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
            checkout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /cart', () => {
    it('should return user cart with items and total', async () => {
      const mockCart = {
        ...createMockCart({ userId: 'user-1' }),
        items: [],
        totalPoints: 0,
        itemCount: 0,
      };
      cartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart('user-1');

      expect(cartService.getCart).toHaveBeenCalledWith('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('POST /cart/items', () => {
    it('should add item to cart', async () => {
      const addDto = { storeItemId: 'item-1', quantity: 2 };
      const mockCart = {
        ...createMockCart({ userId: 'user-1' }),
        items: [],
        totalPoints: 100,
        itemCount: 1,
      };
      cartService.addToCart.mockResolvedValue(mockCart);

      const result = await controller.addToCart('user-1', addDto);

      expect(cartService.addToCart).toHaveBeenCalledWith('user-1', addDto);
      expect(result).toBeDefined();
    });
  });

  describe('PATCH /cart/items/:itemId', () => {
    it('should update cart item quantity', async () => {
      const updateDto = { quantity: 5 };
      const mockCart = {
        ...createMockCart({ userId: 'user-1' }),
        items: [],
        totalPoints: 250,
        itemCount: 1,
      };
      cartService.updateCartItem.mockResolvedValue(mockCart);

      const result = await controller.updateCartItem('user-1', 'cart-item-1', updateDto);

      expect(cartService.updateCartItem).toHaveBeenCalledWith('user-1', 'cart-item-1', updateDto);
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /cart/items/:itemId', () => {
    it('should remove item from cart', async () => {
      const mockCart = {
        ...createMockCart({ userId: 'user-1' }),
        items: [],
        totalPoints: 0,
        itemCount: 0,
      };
      cartService.removeFromCart.mockResolvedValue(mockCart);

      const result = await controller.removeFromCart('user-1', 'cart-item-1');

      expect(cartService.removeFromCart).toHaveBeenCalledWith('user-1', 'cart-item-1');
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /cart', () => {
    it('should clear all items from cart', async () => {
      const mockCart = {
        ...createMockCart({ userId: 'user-1' }),
        items: [],
        totalPoints: 0,
        itemCount: 0,
      };
      cartService.clearCart.mockResolvedValue(mockCart);

      const result = await controller.clearCart('user-1');

      expect(cartService.clearCart).toHaveBeenCalledWith('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('POST /cart/checkout', () => {
    it('should process checkout and create order', async () => {
      const mockCheckoutResult = {
        message: 'Order completed successfully',
        order: {
          id: 'order-1',
          userId: 'user-1',
          totalPoints: 200,
          status: 'COMPLETED',
        },
        remainingBalance: 300,
      };
      cartService.checkout.mockResolvedValue(mockCheckoutResult);

      const result = await controller.checkout('user-1');

      expect(cartService.checkout).toHaveBeenCalledWith('user-1');
      expect(result.message).toBe('Order completed successfully');
    });
  });
});
