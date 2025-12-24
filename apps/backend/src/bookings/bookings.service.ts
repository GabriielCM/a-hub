import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus, Role } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const bookingDate = new Date(createBookingDto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past or today
    if (bookingDate <= today) {
      throw new BadRequestException(
        'Cannot book for today or past dates. Please select a future date.',
      );
    }

    // Check if space exists
    const space = await this.prisma.space.findUnique({
      where: { id: createBookingDto.spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if there's already a booking for this space on this date
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        spaceId: createBookingDto.spaceId,
        date: bookingDate,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED],
        },
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'This space is already booked for the selected date',
      );
    }

    return this.prisma.booking.create({
      data: {
        date: bookingDate,
        spaceId: createBookingDto.spaceId,
        userId,
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            value: true,
            photos: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        space: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        space: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId: string,
    userRole: Role,
  ) {
    const booking = await this.findById(id);

    // Only admin can approve/reject
    if (
      updateBookingDto.status &&
      (updateBookingDto.status === BookingStatus.APPROVED ||
        updateBookingDto.status === BookingStatus.REJECTED)
    ) {
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admins can approve or reject bookings',
        );
      }
    }

    // Users can only cancel their own bookings
    if (updateBookingDto.status === BookingStatus.CANCELLED) {
      if (userRole !== Role.ADMIN && booking.userId !== userId) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: updateBookingDto.status },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const booking = await this.findById(id);

    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenException('You can only delete your own bookings');
    }

    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async exportToCsv() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        space: {
          select: {
            name: true,
            value: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const headers = ['Data', 'Espaço', 'Valor', 'Usuário', 'Email', 'Status'];
    const rows = bookings.map((b) => [
      b.date.toISOString().split('T')[0],
      b.space.name,
      b.space.value.toString(),
      b.user.name,
      b.user.email,
      b.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    return csvContent;
  }
}
