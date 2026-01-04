import { Test, TestingModule } from '@nestjs/testing';
import { Role, BookingStatus } from '@prisma/client';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { createMockBooking } from '../../test/factories';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: jest.Mocked<BookingsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
            remove: jest.fn(),
            exportToCsv: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /bookings', () => {
    it('should create a new booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createDto = { spaceId: 'space-1', date: tomorrow.toISOString() };
      const mockBooking = {
        ...createMockBooking({ userId: 'user-1', spaceId: 'space-1' }),
        space: { id: 'space-1', name: 'Test Space', value: 100 },
      };
      bookingsService.create.mockResolvedValue(mockBooking);

      const result = await controller.create(createDto, 'user-1');

      expect(bookingsService.create).toHaveBeenCalledWith(createDto, 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('GET /bookings', () => {
    it('should return bookings for current user', async () => {
      const mockBookings = [createMockBooking({ userId: 'user-1' })];
      bookingsService.findAllByUser.mockResolvedValue(mockBookings);

      const result = await controller.findAllByUser('user-1');

      expect(bookingsService.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /bookings/all', () => {
    it('should return all bookings for admin', async () => {
      const mockBookings = [createMockBooking(), createMockBooking()];
      bookingsService.findAll.mockResolvedValue(mockBookings);

      const result = await controller.findAll();

      expect(bookingsService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GET /bookings/export', () => {
    it('should export bookings to CSV', async () => {
      const csvContent = 'Data,Espaço,Valor,Usuário,Email,Status\n2024-01-15,Salão,200,John,john@test.com,APPROVED';
      bookingsService.exportToCsv.mockResolvedValue(csvContent);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportToCsv(mockResponse as any);

      expect(bookingsService.exportToCsv).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=bookings-'),
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return a booking by id', async () => {
      const mockBooking = createMockBooking({ id: 'booking-1' });
      bookingsService.findById.mockResolvedValue(mockBooking);

      const result = await controller.findOne('booking-1');

      expect(bookingsService.findById).toHaveBeenCalledWith('booking-1');
      expect(result.id).toBe('booking-1');
    });
  });

  describe('PATCH /bookings/:id', () => {
    it('should update booking status', async () => {
      const updateDto = { status: BookingStatus.APPROVED };
      const mockBooking = createMockBooking({ id: 'booking-1', status: BookingStatus.APPROVED });
      bookingsService.updateStatus.mockResolvedValue(mockBooking);

      const result = await controller.updateStatus(
        'booking-1',
        updateDto,
        'admin-1',
        Role.ADMIN,
      );

      expect(bookingsService.updateStatus).toHaveBeenCalledWith(
        'booking-1',
        updateDto,
        'admin-1',
        Role.ADMIN,
      );
      expect(result.status).toBe(BookingStatus.APPROVED);
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete a booking', async () => {
      const mockBooking = createMockBooking({ id: 'booking-1' });
      bookingsService.remove.mockResolvedValue(mockBooking);

      const result = await controller.remove('booking-1', 'user-1', Role.COLLABORATOR);

      expect(bookingsService.remove).toHaveBeenCalledWith('booking-1', 'user-1', Role.COLLABORATOR);
      expect(result.id).toBe('booking-1');
    });
  });
});
