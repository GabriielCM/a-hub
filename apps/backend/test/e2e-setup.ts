import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createMockPrismaService, resetMocks } from './setup';
import { resetAllCounters } from './factories';

// Extend Jest timeout
jest.setTimeout(30000);

// Mock bcrypt for faster tests
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockImplementation((plain: string, hashed: string) =>
    Promise.resolve(plain === 'correct_password' || hashed === 'hashed_password'),
  ),
}));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

// Type definitions
export interface TestContext {
  app: INestApplication;
  prisma: ReturnType<typeof createMockPrismaService>;
  jwtService: JwtService;
}

export interface TestTokens {
  adminToken: string;
  userToken: string;
  displayToken: string;
}

export interface TestUser {
  id: string;
  email: string;
  role: Role;
}

// Test users
export const testUsers = {
  admin: {
    id: 'admin-test-id',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: Role.ADMIN,
  },
  user: {
    id: 'user-test-id',
    email: 'user@test.com',
    name: 'Test User',
    role: Role.COLLABORATOR,
  },
  display: {
    id: 'display-test-id',
    email: 'display@test.com',
    name: 'Test Display',
    role: Role.DISPLAY,
  },
};

// Create test application instance
export async function createTestApp(): Promise<TestContext> {
  const mockPrisma = createMockPrismaService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .compile();

  const app = moduleFixture.createNestApplication();

  // Apply same configuration as main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.init();

  const jwtService = moduleFixture.get<JwtService>(JwtService);

  return { app, prisma: mockPrisma as any, jwtService };
}

// Generate test JWT tokens
export function generateTestTokens(jwtService: JwtService): TestTokens {
  const adminPayload = {
    sub: testUsers.admin.id,
    email: testUsers.admin.email,
    role: testUsers.admin.role,
  };
  const userPayload = {
    sub: testUsers.user.id,
    email: testUsers.user.email,
    role: testUsers.user.role,
  };
  const displayPayload = {
    sub: testUsers.display.id,
    email: testUsers.display.email,
    role: testUsers.display.role,
  };

  return {
    adminToken: jwtService.sign(adminPayload),
    userToken: jwtService.sign(userPayload),
    displayToken: jwtService.sign(displayPayload),
  };
}

// Helper to reset test state between tests
export function resetTestState(prisma: ReturnType<typeof createMockPrismaService>): void {
  resetAllCounters();
  resetMocks(prisma);
}

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
