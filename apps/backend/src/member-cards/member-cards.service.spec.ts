import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { MemberCardsService } from './member-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockUser, createMockDisplayUser } from '../../test/factories';

describe('MemberCardsService', () => {
  let service: MemberCardsService;
  let prisma: jest.Mocked<PrismaService>;

  const createMockMemberCard = (overrides = {}) => ({
    id: 'card-1',
    userId: 'user-1',
    matricula: '12345',
    photo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberCardsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            memberCard: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MemberCardsService>(MemberCardsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a member card successfully', async () => {
      const mockUser = createMockUser();
      const createDto = { userId: mockUser.id, matricula: '12345' };
      const mockCard = {
        ...createMockMemberCard(createDto),
        user: mockUser,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.memberCard.findUnique
        .mockResolvedValueOnce(null) // Check by userId
        .mockResolvedValueOnce(null); // Check by matricula
      prisma.memberCard.create.mockResolvedValue(mockCard);

      const result = await service.create(createDto);

      expect(prisma.memberCard.create).toHaveBeenCalled();
      expect(result.matricula).toBe('12345');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ userId: 'non-existent', matricula: '12345' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create({ userId: 'non-existent', matricula: '12345' }),
      ).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if user role is DISPLAY', async () => {
      const displayUser = createMockDisplayUser();

      prisma.user.findUnique.mockResolvedValue(displayUser);

      await expect(
        service.create({ userId: displayUser.id, matricula: '12345' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ userId: displayUser.id, matricula: '12345' }),
      ).rejects.toThrow('Users with DISPLAY role cannot have a member card');
    });

    it('should throw ConflictException if user already has a card', async () => {
      const mockUser = createMockUser();
      const existingCard = createMockMemberCard({ userId: mockUser.id });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.memberCard.findUnique.mockResolvedValue(existingCard);

      await expect(
        service.create({ userId: mockUser.id, matricula: '12345' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ userId: mockUser.id, matricula: '12345' }),
      ).rejects.toThrow('User already has a member card');
    });

    it('should throw ConflictException if matricula is already taken', async () => {
      const mockUser = createMockUser();
      const existingCard = createMockMemberCard({ matricula: '12345', userId: 'other-user' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      // First call checks userId, second call checks matricula
      prisma.memberCard.findUnique
        .mockResolvedValueOnce(null) // No card by userId (first create call)
        .mockResolvedValueOnce(existingCard) // Card exists by matricula (first create call)
        .mockResolvedValueOnce(null) // No card by userId (second create call for error message)
        .mockResolvedValueOnce(existingCard); // Card exists by matricula (second create call)

      await expect(
        service.create({ userId: mockUser.id, matricula: '12345' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ userId: mockUser.id, matricula: '12345' }),
      ).rejects.toThrow('Matricula already exists');
    });
  });

  describe('findAll', () => {
    it('should return all member cards ordered by matricula', async () => {
      const mockCards = [
        { ...createMockMemberCard({ matricula: '11111' }), user: {} },
        { ...createMockMemberCard({ matricula: '22222' }), user: {} },
      ];

      prisma.memberCard.findMany.mockResolvedValue(mockCards);

      const result = await service.findAll();

      expect(prisma.memberCard.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: expect.any(Object),
          },
        },
        orderBy: { matricula: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a member card by id', async () => {
      const mockCard = { ...createMockMemberCard(), user: {} };

      prisma.memberCard.findUnique.mockResolvedValue(mockCard);

      const result = await service.findOne(mockCard.id);

      expect(result.id).toBe(mockCard.id);
    });

    it('should throw NotFoundException if card not found', async () => {
      prisma.memberCard.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Member card not found',
      );
    });
  });

  describe('findByUserId', () => {
    it('should return a member card by user id', async () => {
      const mockCard = { ...createMockMemberCard({ userId: 'user-1' }), user: {} };

      prisma.memberCard.findUnique.mockResolvedValue(mockCard);

      const result = await service.findByUserId('user-1');

      expect(prisma.memberCard.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
      });
      expect(result.userId).toBe('user-1');
    });

    it('should throw NotFoundException if card not found', async () => {
      prisma.memberCard.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('user-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByUserId('user-1')).rejects.toThrow(
        'Member card not found for this user',
      );
    });
  });

  describe('update', () => {
    it('should update a member card', async () => {
      const mockCard = { ...createMockMemberCard(), user: {} };
      const updateDto = { matricula: '99999' };

      prisma.memberCard.findUnique.mockResolvedValue(mockCard);
      prisma.memberCard.findFirst.mockResolvedValue(null);
      prisma.memberCard.update.mockResolvedValue({
        ...mockCard,
        ...updateDto,
      });

      const result = await service.update(mockCard.id, updateDto);

      expect(result.matricula).toBe('99999');
    });

    it('should throw ConflictException if new matricula is taken', async () => {
      const mockCard = { ...createMockMemberCard({ id: 'card-1' }), user: {} };
      const existingCard = createMockMemberCard({ id: 'card-2', matricula: '99999' });

      prisma.memberCard.findUnique.mockResolvedValue(mockCard);
      prisma.memberCard.findFirst.mockResolvedValue(existingCard);

      await expect(
        service.update(mockCard.id, { matricula: '99999' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockCard.id, { matricula: '99999' }),
      ).rejects.toThrow('Matricula already exists');
    });
  });

  describe('remove', () => {
    it('should delete a member card', async () => {
      const mockCard = { ...createMockMemberCard(), user: {} };

      prisma.memberCard.findUnique.mockResolvedValue(mockCard);
      prisma.memberCard.delete.mockResolvedValue(mockCard);

      const result = await service.remove(mockCard.id);

      expect(prisma.memberCard.delete).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
      expect(result.id).toBe(mockCard.id);
    });

    it('should throw NotFoundException if card not found', async () => {
      prisma.memberCard.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
