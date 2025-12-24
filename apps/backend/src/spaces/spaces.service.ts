import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async create(createSpaceDto: CreateSpaceDto) {
    const existingSpace = await this.prisma.space.findUnique({
      where: { name: createSpaceDto.name },
    });

    if (existingSpace) {
      throw new ConflictException('Space with this name already exists');
    }

    return this.prisma.space.create({
      data: createSpaceDto,
    });
  }

  async findAll() {
    return this.prisma.space.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            date: {
              gte: new Date(),
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

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto) {
    await this.findById(id);

    if (updateSpaceDto.name) {
      const existingSpace = await this.prisma.space.findFirst({
        where: {
          name: updateSpaceDto.name,
          NOT: { id },
        },
      });

      if (existingSpace) {
        throw new ConflictException('Space with this name already exists');
      }
    }

    return this.prisma.space.update({
      where: { id },
      data: updateSpaceDto,
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.space.delete({
      where: { id },
    });
  }

  async getAvailability(id: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bookings = await this.prisma.booking.findMany({
      where: {
        spaceId: id,
        date: {
          gte: startDate,
          lte: endDate,
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

    return {
      spaceId: id,
      month,
      year,
      bookedDates: bookings.map((b) => ({
        date: b.date,
        status: b.status,
      })),
    };
  }
}
