import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KyoskQRService } from './qr.service';
import { KyoskStatus, KyoskProductStatus, KyoskOrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto';

// QR Code expires in 5 minutes
const QR_EXPIRATION_MINUTES = 5;

@Injectable()
export class DisplayService {
  constructor(
    private prisma: PrismaService,
    private qrService: KyoskQRService,
  ) {}

  async getDisplayData(kyoskId: string) {
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyoskId },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    if (kyosk.status !== KyoskStatus.ACTIVE) {
      throw new BadRequestException('Kyosk nao esta ativo');
    }

    const products = await this.prisma.kyoskProduct.findMany({
      where: {
        kyoskId,
        status: KyoskProductStatus.ACTIVE,
        stock: { gt: 0 },
      },
      orderBy: { name: 'asc' },
    });

    return {
      kyosk: {
        id: kyosk.id,
        name: kyosk.name,
        description: kyosk.description,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        pointsPrice: p.pointsPrice,
        stock: p.stock,
      })),
    };
  }

  async createOrder(kyoskId: string, dto: CreateOrderDto) {
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyoskId },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    if (kyosk.status !== KyoskStatus.ACTIVE) {
      throw new BadRequestException('Kyosk nao esta ativo');
    }

    // Validate products and calculate total
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.kyoskProduct.findMany({
      where: {
        id: { in: productIds },
        kyoskId,
        status: KyoskProductStatus.ACTIVE,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos nao encontrados ou inativos');
    }

    // Validate stock
    let totalPoints = 0;
    const orderItems: Array<{
      kyoskProductId: string;
      quantity: number;
      pointsPrice: number;
    }> = [];

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} nao encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para ${product.name}`);
      }

      totalPoints += product.pointsPrice * item.quantity;
      orderItems.push({
        kyoskProductId: product.id,
        quantity: item.quantity,
        pointsPrice: product.pointsPrice,
      });
    }

    // Create order with items
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + QR_EXPIRATION_MINUTES);

    const order = await this.prisma.kyoskOrder.create({
      data: {
        kyoskId,
        totalPoints,
        status: KyoskOrderStatus.PENDING,
        qrPayload: '', // Will update after generating
        expiresAt,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            kyoskProduct: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Generate QR payload
    const qrPayload = this.qrService.generatePayload(
      kyoskId,
      order.id,
      totalPoints,
      expiresAt,
      kyosk.qrSecret,
    );

    // Update order with QR payload
    const updatedOrder = await this.prisma.kyoskOrder.update({
      where: { id: order.id },
      data: { qrPayload },
      include: {
        items: {
          include: {
            kyoskProduct: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedOrder.id,
      kyoskId: updatedOrder.kyoskId,
      totalPoints: updatedOrder.totalPoints,
      status: updatedOrder.status,
      qrPayload: updatedOrder.qrPayload,
      expiresAt: updatedOrder.expiresAt,
      items: updatedOrder.items.map((item) => ({
        id: item.id,
        productName: item.kyoskProduct.name,
        quantity: item.quantity,
        pointsPrice: item.pointsPrice,
      })),
      createdAt: updatedOrder.createdAt,
    };
  }

  async getOrderStatus(kyoskId: string, orderId: string) {
    const order = await this.prisma.kyoskOrder.findFirst({
      where: {
        id: orderId,
        kyoskId,
      },
      include: {
        items: {
          include: {
            kyoskProduct: {
              select: {
                name: true,
              },
            },
          },
        },
        paidByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    // Check if expired and update status
    if (order.status === KyoskOrderStatus.PENDING && new Date() > order.expiresAt) {
      await this.prisma.kyoskOrder.update({
        where: { id: orderId },
        data: { status: KyoskOrderStatus.EXPIRED },
      });
      order.status = KyoskOrderStatus.EXPIRED;
    }

    return {
      id: order.id,
      kyoskId: order.kyoskId,
      totalPoints: order.totalPoints,
      status: order.status,
      qrPayload: order.qrPayload,
      expiresAt: order.expiresAt,
      paidByUser: order.paidByUser,
      paidAt: order.paidAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.kyoskProduct.name,
        quantity: item.quantity,
        pointsPrice: item.pointsPrice,
      })),
      createdAt: order.createdAt,
    };
  }

  async cancelOrder(kyoskId: string, orderId: string) {
    const order = await this.prisma.kyoskOrder.findFirst({
      where: {
        id: orderId,
        kyoskId,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    if (order.status !== KyoskOrderStatus.PENDING) {
      throw new BadRequestException('Apenas pedidos pendentes podem ser cancelados');
    }

    return this.prisma.kyoskOrder.update({
      where: { id: orderId },
      data: { status: KyoskOrderStatus.CANCELLED },
    });
  }
}
