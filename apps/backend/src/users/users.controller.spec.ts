import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { createMockUser, createMockAdmin } from '../../test/factories';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findAllPublic: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers = [createMockUser(), createMockAdmin()];
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /users/search', () => {
    it('should return public user data for search', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'User 1', email: 'user1@test.com' },
        { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      ];
      usersService.findAllPublic.mockResolvedValue(mockUsers);

      const result = await controller.findAllForSearch();

      expect(usersService.findAllPublic).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /users/me', () => {
    it('should return current user without sensitive fields', async () => {
      const mockUser = {
        ...createMockUser(),
        password: 'hashedpassword',
        refreshToken: 'sometoken',
      };
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMe('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id without sensitive fields', async () => {
      const mockUser = {
        ...createMockUser({ id: 'user-1' }),
        password: 'hashedpassword',
        refreshToken: 'sometoken',
      };
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      const mockUser = createMockUser({ id: 'user-1', name: 'Updated Name' });
      usersService.update.mockResolvedValue(mockUser);

      const result = await controller.update('user-1', { name: 'Updated Name' });

      expect(usersService.update).toHaveBeenCalledWith('user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const mockUser = createMockUser({ id: 'user-1' });
      usersService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1');
      expect(result.id).toBe('user-1');
    });
  });
});
