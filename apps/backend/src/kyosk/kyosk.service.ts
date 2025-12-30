import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KyoskStatus } from '@prisma/client';
import { CreateKyoskDto, UpdateKyoskDto } from './dto';

@Injectable()
export class KyoskService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateKyoskDto) {
    const existing = await this.prisma.kyosk.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Kyosk com este nome ja existe');
    }

    return this.prisma.kyosk.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.kyosk.findMany({
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    return kyosk;
  }

  async update(id: string, dto: UpdateKyoskDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await this.prisma.kyosk.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Kyosk com este nome ja existe');
      }
    }

    return this.prisma.kyosk.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.kyosk.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string) {
    const kyosk = await this.findById(id);

    const newStatus =
      kyosk.status === KyoskStatus.ACTIVE
        ? KyoskStatus.INACTIVE
        : KyoskStatus.ACTIVE;

    return this.prisma.kyosk.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async getLowStockAlerts() {
    const kyosks = await this.prisma.kyosk.findMany({
      where: { status: KyoskStatus.ACTIVE },
      include: {
        products: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    const alerts: Array<{
      kyoskId: string;
      kyoskName: string;
      productId: string;
      productName: string;
      currentStock: number;
      threshold: number;
    }> = [];

    for (const kyosk of kyosks) {
      for (const product of kyosk.products) {
        if (product.stock <= kyosk.lowStockThreshold) {
          alerts.push({
            kyoskId: kyosk.id,
            kyoskName: kyosk.name,
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            threshold: kyosk.lowStockThreshold,
          });
        }
      }
    }

    return alerts;
  }
}
