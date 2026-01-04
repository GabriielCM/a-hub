import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createMockUser } from '../../test/factories';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            refreshTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const registerDto = {
      email: 'new@test.com',
      password: 'password123',
      name: 'New User',
    };

    it('should register a new user and return tokens with user data', async () => {
      const mockUser = createMockUser({ email: registerDto.email });
      const expectedResponse = {
        ...mockTokens,
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role },
      };

      authService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'user@test.com',
      password: 'password123',
    };

    it('should login user and return tokens with user data', async () => {
      const mockUser = createMockUser({ email: loginDto.email });
      const expectedResponse = {
        ...mockTokens,
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role },
      };

      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user and return success message', async () => {
      const userId = 'user-1';
      const expectedResponse = { message: 'Logged out successfully' };

      authService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(userId);

      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens and return new tokens', async () => {
      const userId = 'user-1';
      const refreshToken = 'old-refresh-token';

      authService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(userId, refreshToken);

      expect(authService.refreshTokens).toHaveBeenCalledWith(userId, refreshToken);
      expect(result).toEqual(mockTokens);
    });
  });
});
