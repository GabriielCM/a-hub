import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockBooking,
  createMockSpace,
  createMockUser,
} from '../../test/factories';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            booking: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            space: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-1';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const createDto = {
      spaceId: 'space-1',
      date: tomorrow.toISOString(),
    };

    it('should create a booking successfully', async () => {
      const mockSpace = createMockSpace({ id: createDto.spaceId });
      const mockBooking = createMockBooking({
        userId,
        spaceId: createDto.spaceId,
      });

      prisma.space.findUnique.mockResolvedValue(mockSpace);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue({
        ...mockBooking,
        space: { id: mockSpace.id, name: mockSpace.name, value: mockSpace.value },
      });

      const result = await service.create(createDto, userId);

      expect(prisma.space.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.spaceId },
      });
      expect(prisma.booking.findFirst).toHaveBeenCalled();
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw BadRequestException for past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pastDto = {
        spaceId: 'space-1',
        date: yesterday.toISOString(),
      };

      await expect(service.create(pastDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(pastDto, userId)).rejects.toThrow(
        'Cannot book for today or past dates',
      );
    });

    it('should throw BadRequestException for today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight to match service comparison

      const todayDto = {
        spaceId: 'space-1',
        date: today.toISOString(),
      };

      await expect(service.create(todayDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(todayDto, userId)).rejects.toThrow(
        'Cannot book for today or past dates',
      );
    });

    it('should throw NotFoundException if space does not exist', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto, userId)).rejects.toThrow(
        'Space not found',
      );
    });

    it('should throw ConflictException if space is already booked', async () => {
      const mockSpace = createMockSpace({ id: createDto.spaceId });
      const existingBooking = createMockBooking({
        spaceId: createDto.spaceId,
        status: BookingStatus.APPROVED,
      });

      prisma.space.findUnique.mockResolvedValue(mockSpace);
      prisma.booking.findFirst.mockResolvedValue(existingBooking);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto, userId)).rejects.toThrow(
        'This space is already booked for the selected date',
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return bookings for a specific user', async () => {
      const userId = 'user-1';
      const mockBookings = [
        createMockBooking({ userId }),
        createMockBooking({ userId }),
      ];

      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findAllByUser(userId);

      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return all bookings with user and space data', async () => {
      const mockBookings = [createMockBooking(), createMockBooking()];

      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findAll();

      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return a booking by id', async () => {
      const mockBooking = createMockBooking();

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findById(mockBooking.id);

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        include: expect.any(Object),
      });
      expect(result.id).toBe(mockBooking.id);
    });

    it('should throw NotFoundException if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent')).rejects.toThrow(
        'Booking not found',
      );
    });
  });

  describe('updateStatus', () => {
    const bookingId = 'booking-1';
    const userId = 'user-1';

    it('should allow admin to approve a booking', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId,
        status: BookingStatus.PENDING,
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.APPROVED,
      });

      const result = await service.updateStatus(
        bookingId,
        { status: BookingStatus.APPROVED },
        'admin-id',
        Role.ADMIN,
      );

      expect(result.status).toBe(BookingStatus.APPROVED);
    });

    it('should allow admin to reject a booking', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId,
        status: BookingStatus.PENDING,
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REJECTED,
      });

      const result = await service.updateStatus(
        bookingId,
        { status: BookingStatus.REJECTED },
        'admin-id',
        Role.ADMIN,
      );

      expect(result.status).toBe(BookingStatus.REJECTED);
    });

    it('should throw ForbiddenException when non-admin tries to approve', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId,
        status: BookingStatus.PENDING,
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus(
          bookingId,
          { status: BookingStatus.APPROVED },
          userId,
          Role.COLLABORATOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow user to cancel their own booking', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId,
        status: BookingStatus.PENDING,
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.updateStatus(
        bookingId,
        { status: BookingStatus.CANCELLED },
        userId,
        Role.COLLABORATOR,
      );

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw ForbiddenException when user tries to cancel another user booking', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId: 'other-user',
        status: BookingStatus.PENDING,
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus(
          bookingId,
          { status: BookingStatus.CANCELLED },
          userId,
          Role.COLLABORATOR,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateStatus(
          bookingId,
          { status: BookingStatus.CANCELLED },
          userId,
          Role.COLLABORATOR,
        ),
      ).rejects.toThrow('You can only cancel your own bookings');
    });
  });

  describe('remove', () => {
    const bookingId = 'booking-1';
    const userId = 'user-1';

    it('should allow owner to delete their booking', async () => {
      const mockBooking = createMockBooking({ id: bookingId, userId });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.delete.mockResolvedValue(mockBooking);

      const result = await service.remove(bookingId, userId, Role.COLLABORATOR);

      expect(prisma.booking.delete).toHaveBeenCalledWith({
        where: { id: bookingId },
      });
      expect(result.id).toBe(bookingId);
    });

    it('should allow admin to delete any booking', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId: 'other-user',
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.delete.mockResolvedValue(mockBooking);

      const result = await service.remove(bookingId, 'admin-id', Role.ADMIN);

      expect(prisma.booking.delete).toHaveBeenCalled();
      expect(result.id).toBe(bookingId);
    });

    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      const mockBooking = createMockBooking({
        id: bookingId,
        userId: 'other-user',
      });

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.remove(bookingId, userId, Role.COLLABORATOR),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove(bookingId, userId, Role.COLLABORATOR),
      ).rejects.toThrow('You can only delete your own bookings');
    });
  });

  describe('exportToCsv', () => {
    it('should generate valid CSV content', async () => {
      const mockBookings = [
        {
          ...createMockBooking({ status: BookingStatus.APPROVED }),
          space: { name: 'Salao de Festas', value: 200 },
          user: { name: 'John Doe', email: 'john@test.com' },
        },
      ];

      prisma.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.exportToCsv();

      expect(result).toContain('Data,Espaço,Valor,Usuário,Email,Status');
      expect(result).toContain('Salao de Festas');
      expect(result).toContain('200');
      expect(result).toContain('John Doe');
      expect(result).toContain('john@test.com');
      expect(result).toContain('APPROVED');
    });

    it('should return only headers for empty bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.exportToCsv();

      expect(result).toBe('Data,Espaço,Valor,Usuário,Email,Status');
    });
  });
});
