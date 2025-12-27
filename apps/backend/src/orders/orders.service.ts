import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all orders for a specific user
   * Orders are sorted by creation date in descending order
   */
  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                photos: true,
                pointsPrice: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all orders (admin only)
   * Includes user information and items with store item details
   */
  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                photos: true,
                pointsPrice: true,
              },
            },
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

  /**
   * Find a single order by ID
   * Validates ownership if user is not admin
   */
  async findOne(id: string, userId?: string, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                photos: true,
                pointsPrice: true,
                description: true,
              },
            },
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
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If not admin, validate that the order belongs to the user
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You can only access your own orders');
    }

    return order;
  }

  /**
   * Update order status (admin only)
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                photos: true,
                pointsPrice: true,
              },
            },
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
    });
  }
}
