import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockUser, createMockAdmin } from '../../test/factories';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
      };
      const mockUser = createMockUser(createDto);

      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result.email).toBe(createDto.email);
    });
  });

  describe('findAll', () => {
    it('should return all users with selected fields', async () => {
      const mockUsers = [createMockUser(), createMockUser()];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findAllPublic', () => {
    it('should return users with limited public fields', async () => {
      const mockUsers = [createMockUser(), createMockUser()];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAllPublic();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = createMockUser();

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = createMockUser({ email: 'test@test.com' });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(result?.email).toBe('test@test.com');
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockUser = createMockUser();
      const updateDto = { name: 'Updated Name' };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update(mockUser.id, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const mockUser = createMockUser();

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash and save refresh token', async () => {
      const mockUser = createMockUser();
      const refreshToken = 'some-refresh-token';

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: 'hashed_password',
      });

      await service.updateRefreshToken(mockUser.id, refreshToken);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: 'hashed_password' },
      });
    });

    it('should set refresh token to null when passed null', async () => {
      const mockUser = createMockUser();

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      await service.updateRefreshToken(mockUser.id, null);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: null },
      });
    });
  });
});
