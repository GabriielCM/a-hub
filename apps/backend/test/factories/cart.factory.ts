import { OrderStatus } from '@prisma/client';

let cartCounter = 0;

export const createMockStoreItem = (overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
  pointsPrice: number;
  stock: number;
  photos: string[];
  offerEndsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  cartCounter++;
  return {
    id: `store-item-${cartCounter}`,
    name: `Test Item ${cartCounter}`,
    description: `Description for item ${cartCounter}`,
    pointsPrice: 50,
    stock: 10,
    photos: ['https://example.com/item.jpg'],
    offerEndsAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockCart = (overrides: Partial<{
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ReturnType<typeof createMockCartItem>[];
}> = {}) => {
  cartCounter++;
  return {
    id: `cart-${cartCounter}`,
    userId: `user-${cartCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
};

export const createMockCartItem = (overrides: Partial<{
  id: string;
  cartId: string;
  storeItemId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  storeItem?: ReturnType<typeof createMockStoreItem>;
}> = {}) => {
  cartCounter++;
  return {
    id: `cart-item-${cartCounter}`,
    cartId: `cart-${cartCounter}`,
    storeItemId: `store-item-${cartCounter}`,
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockOrder = (overrides: Partial<{
  id: string;
  userId: string;
  totalPoints: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  cartCounter++;
  return {
    id: `order-${cartCounter}`,
    userId: `user-${cartCounter}`,
    totalPoints: 100,
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const resetCartCounter = () => {
  cartCounter = 0;
};
