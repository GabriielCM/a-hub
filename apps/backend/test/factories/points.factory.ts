import { PointsTransactionType } from '@prisma/client';

let pointsCounter = 0;

export const createMockPointsBalance = (overrides: Partial<{
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  pointsCounter++;
  return {
    id: `points-balance-${pointsCounter}`,
    userId: `user-${pointsCounter}`,
    balance: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockPointsTransaction = (overrides: Partial<{
  id: string;
  pointsBalanceId: string;
  type: PointsTransactionType;
  amount: number;
  description: string;
  relatedUserId: string | null;
  orderId: string | null;
  createdAt: Date;
}> = {}) => {
  pointsCounter++;
  return {
    id: `points-tx-${pointsCounter}`,
    pointsBalanceId: `points-balance-${pointsCounter}`,
    type: PointsTransactionType.CREDIT,
    amount: 100,
    description: 'Test transaction',
    relatedUserId: null,
    orderId: null,
    createdAt: new Date(),
    ...overrides,
  };
};

export const resetPointsCounter = () => {
  pointsCounter = 0;
};
