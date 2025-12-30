import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KyoskQRService } from './qr.service';
import { KyoskOrderStatus, PointsTransactionType } from '@prisma/client';

export interface PaymentResult {
  success: boolean;
  orderId: string;
  totalPoints: number;
  kyoskName: string;
}

export interface PaymentPreview {
  kyoskName: string;
  totalPoints: number;
  expiresAt: Date;
  items: Array<{
    productName: string;
    quantity: number;
    pointsPrice: number;
  }>;
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private qrService: KyoskQRService,
  ) {}

  async validatePayment(qrPayload: string): Promise<PaymentPreview> {
    // Validate QR payload
    const validation = await this.qrService.validatePayload(qrPayload);

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const { orderId } = validation;

    if (!orderId) {
      throw new BadRequestException('QR code invalido');
    }

    // Get order details
    const order = await this.prisma.kyoskOrder.findUnique({
      where: { id: orderId },
      include: {
        kyosk: {
          select: {
            name: true,
          },
        },
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

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    return {
      kyoskName: order.kyosk.name,
      totalPoints: order.totalPoints,
      expiresAt: order.expiresAt,
      items: order.items.map((item) => ({
        productName: item.kyoskProduct.name,
        quantity: item.quantity,
        pointsPrice: item.pointsPrice,
      })),
    };
  }

  async processPayment(userId: string, qrPayload: string): Promise<PaymentResult> {
    // 1. Validate QR payload
    const validation = await this.qrService.validatePayload(qrPayload);

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const { orderId } = validation;

    if (!orderId) {
      throw new BadRequestException('QR code invalido');
    }

    // 2. Get order with items
    const order = await this.prisma.kyoskOrder.findUnique({
      where: { id: orderId },
      include: {
        kyosk: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            kyoskProduct: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    // 3. Validate order status is PENDING
    if (order.status !== KyoskOrderStatus.PENDING) {
      throw new BadRequestException('Pedido ja foi processado');
    }

    // 4. Validate not expired
    if (new Date() > order.expiresAt) {
      await this.prisma.kyoskOrder.update({
        where: { id: order.id },
        data: { status: KyoskOrderStatus.EXPIRED },
      });
      throw new BadRequestException('QR code expirado');
    }

    // 5. Get user balance
    let userBalance = await this.prisma.pointsBalance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userBalance) {
      // Create balance with 0
      userBalance = await this.prisma.pointsBalance.create({
        data: { userId, balance: 0 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    if (userBalance.balance < order.totalPoints) {
      throw new BadRequestException('Saldo insuficiente');
    }

    // 6. Validate stock for all items
    for (const item of order.items) {
      if (item.kyoskProduct.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${item.kyoskProduct.name}`,
        );
      }
    }

    // 7. Execute atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Debit user points
      await tx.pointsBalance.update({
        where: { id: userBalance.id },
        data: { balance: { decrement: order.totalPoints } },
      });

      // Create transaction record
      await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: userBalance.id,
          type: PointsTransactionType.KYOSK_PURCHASE,
          amount: -order.totalPoints,
          description: `Compra no Kyosk: ${order.kyosk.name}`,
          orderId: order.id,
        },
      });

      // Decrement stock for each item
      for (const item of order.items) {
        await tx.kyoskProduct.update({
          where: { id: item.kyoskProductId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.kyoskStockMovement.create({
          data: {
            kyoskProductId: item.kyoskProductId,
            quantity: -item.quantity,
            reason: `Venda - Pedido ${order.id}`,
          },
        });
      }

      // Mark order as completed
      return tx.kyoskOrder.update({
        where: { id: order.id },
        data: {
          status: KyoskOrderStatus.COMPLETED,
          paidByUserId: userId,
          paidAt: new Date(),
        },
      });
    });

    return {
      success: true,
      orderId: result.id,
      totalPoints: order.totalPoints,
      kyoskName: order.kyosk.name,
    };
  }
}
