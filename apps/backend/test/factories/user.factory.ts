import { Role } from '@prisma/client';

let userCounter = 0;

export const createMockUser = (overrides: Partial<{
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  userCounter++;
  return {
    id: `user-${userCounter}`,
    email: `user${userCounter}@test.com`,
    password: 'hashed_password',
    name: `Test User ${userCounter}`,
    role: Role.COLLABORATOR,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockAdmin = (overrides: Partial<ReturnType<typeof createMockUser>> = {}) => {
  return createMockUser({
    role: Role.ADMIN,
    ...overrides,
  });
};

export const createMockDisplayUser = (overrides: Partial<ReturnType<typeof createMockUser>> = {}) => {
  return createMockUser({
    role: Role.DISPLAY,
    ...overrides,
  });
};

export const resetUserCounter = () => {
  userCounter = 0;
};
