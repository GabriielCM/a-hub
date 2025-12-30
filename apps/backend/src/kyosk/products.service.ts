import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KyoskProductStatus } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(kyoskId: string, dto: CreateProductDto) {
    // Verify kyosk exists
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyoskId },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    const product = await this.prisma.kyoskProduct.create({
      data: {
        kyoskId,
        ...dto,
      },
    });

    // Create initial stock movement if stock > 0
    if (dto.stock > 0) {
      await this.prisma.kyoskStockMovement.create({
        data: {
          kyoskProductId: product.id,
          quantity: dto.stock,
          reason: 'Estoque inicial',
        },
      });
    }

    return product;
  }

  async findAll(kyoskId: string) {
    // Verify kyosk exists
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyoskId },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    return this.prisma.kyoskProduct.findMany({
      where: { kyoskId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(kyoskId: string, productId: string) {
    const product = await this.prisma.kyoskProduct.findFirst({
      where: {
        id: productId,
        kyoskId,
      },
      include: {
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }

    return product;
  }

  async update(kyoskId: string, productId: string, dto: UpdateProductDto) {
    await this.findById(kyoskId, productId);

    return this.prisma.kyoskProduct.update({
      where: { id: productId },
      data: dto,
    });
  }

  async delete(kyoskId: string, productId: string) {
    await this.findById(kyoskId, productId);

    return this.prisma.kyoskProduct.delete({
      where: { id: productId },
    });
  }

  async adjustStock(kyoskId: string, productId: string, dto: AdjustStockDto) {
    const product = await this.findById(kyoskId, productId);

    const newStock = product.stock + dto.quantity;

    if (newStock < 0) {
      throw new BadRequestException('Estoque nao pode ser negativo');
    }

    // Update stock and create movement in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.kyoskProduct.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.kyoskStockMovement.create({
        data: {
          kyoskProductId: productId,
          quantity: dto.quantity,
          reason: dto.reason,
        },
      });

      return updatedProduct;
    });

    return result;
  }

  async toggleStatus(kyoskId: string, productId: string) {
    const product = await this.findById(kyoskId, productId);

    const newStatus =
      product.status === KyoskProductStatus.ACTIVE
        ? KyoskProductStatus.INACTIVE
        : KyoskProductStatus.ACTIVE;

    return this.prisma.kyoskProduct.update({
      where: { id: productId },
      data: { status: newStatus },
    });
  }
}
