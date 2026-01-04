import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockSpace, createMockBooking } from '../../test/factories';

describe('SpacesService', () => {
  let service: SpacesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpacesService,
        {
          provide: PrismaService,
          useValue: {
            space: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            booking: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SpacesService>(SpacesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new space', async () => {
      const createDto = {
        name: 'Salão de Festas',
        value: 500,
        description: 'Beautiful party hall',
      };
      const mockSpace = createMockSpace(createDto);

      prisma.space.findUnique.mockResolvedValue(null);
      prisma.space.create.mockResolvedValue(mockSpace);

      const result = await service.create(createDto);

      expect(prisma.space.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result.name).toBe(createDto.name);
    });

    it('should throw ConflictException if space name already exists', async () => {
      const existingSpace = createMockSpace({ name: 'Existing Space' });

      prisma.space.findUnique.mockResolvedValue(existingSpace);

      await expect(
        service.create({ name: 'Existing Space', value: 100 }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ name: 'Existing Space', value: 100 }),
      ).rejects.toThrow('Space with this name already exists');
    });
  });

  describe('findAll', () => {
    it('should return all spaces ordered by name', async () => {
      const mockSpaces = [
        createMockSpace({ name: 'Alpha' }),
        createMockSpace({ name: 'Beta' }),
      ];

      prisma.space.findMany.mockResolvedValue(mockSpaces);

      const result = await service.findAll();

      expect(prisma.space.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return a space with future bookings', async () => {
      const mockSpace = {
        ...createMockSpace(),
        bookings: [{ id: 'booking-1', date: new Date(), status: 'PENDING' }],
      };

      prisma.space.findUnique.mockResolvedValue(mockSpace);

      const result = await service.findById(mockSpace.id);

      expect(prisma.space.findUnique).toHaveBeenCalledWith({
        where: { id: mockSpace.id },
        include: {
          bookings: {
            where: {
              date: {
                gte: expect.any(Date),
              },
            },
            select: {
              id: true,
              date: true,
              status: true,
            },
            orderBy: { date: 'asc' },
          },
        },
      });
      expect(result.id).toBe(mockSpace.id);
    });

    it('should throw NotFoundException if space not found', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent')).rejects.toThrow(
        'Space not found',
      );
    });
  });

  describe('update', () => {
    it('should update a space', async () => {
      const mockSpace = createMockSpace();
      const updateDto = { value: 600 };

      prisma.space.findUnique.mockResolvedValue({ ...mockSpace, bookings: [] });
      prisma.space.update.mockResolvedValue({ ...mockSpace, ...updateDto });

      const result = await service.update(mockSpace.id, updateDto);

      expect(prisma.space.update).toHaveBeenCalledWith({
        where: { id: mockSpace.id },
        data: updateDto,
      });
      expect(result.value).toBe(600);
    });

    it('should throw ConflictException if updating to existing name', async () => {
      const mockSpace = createMockSpace({ id: 'space-1', name: 'Space One' });
      const existingSpace = createMockSpace({ id: 'space-2', name: 'Space Two' });

      prisma.space.findUnique.mockResolvedValue({ ...mockSpace, bookings: [] });
      prisma.space.findFirst.mockResolvedValue(existingSpace);

      await expect(
        service.update(mockSpace.id, { name: 'Space Two' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same name', async () => {
      const mockSpace = createMockSpace({ name: 'Same Name' });

      prisma.space.findUnique.mockResolvedValue({ ...mockSpace, bookings: [] });
      prisma.space.findFirst.mockResolvedValue(null);
      prisma.space.update.mockResolvedValue(mockSpace);

      const result = await service.update(mockSpace.id, { name: 'Same Name' });

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete a space', async () => {
      const mockSpace = createMockSpace();

      prisma.space.findUnique.mockResolvedValue({ ...mockSpace, bookings: [] });
      prisma.space.delete.mockResolvedValue(mockSpace);

      const result = await service.remove(mockSpace.id);

      expect(prisma.space.delete).toHaveBeenCalledWith({
        where: { id: mockSpace.id },
      });
      expect(result.id).toBe(mockSpace.id);
    });

    it('should throw NotFoundException if space not found', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAvailability', () => {
    it('should return availability for a month', async () => {
      const spaceId = 'space-1';
      const mockBookings = [
        { date: new Date(2024, 0, 15), status: 'APPROVED' },
        { date: new Date(2024, 0, 20), status: 'PENDING' },
      ];

      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.getAvailability(spaceId, 1, 2024);

      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          spaceId,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: {
            in: ['PENDING', 'APPROVED'],
          },
        },
        select: {
          date: true,
          status: true,
        },
      });
      expect(result.spaceId).toBe(spaceId);
      expect(result.month).toBe(1);
      expect(result.year).toBe(2024);
      expect(result.bookedDates).toHaveLength(2);
    });
  });
});
