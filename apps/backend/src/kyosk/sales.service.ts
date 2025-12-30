import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KyoskOrderStatus } from '@prisma/client';

export interface SalesQuery {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getSales(kyoskId: string, query: SalesQuery) {
    const kyosk = await this.prisma.kyosk.findUnique({
      where: { id: kyoskId },
    });

    if (!kyosk) {
      throw new NotFoundException('Kyosk nao encontrado');
    }

    const { startDate, endDate } = query;

    const where: any = {
      kyoskId,
      status: KyoskOrderStatus.COMPLETED,
    };

    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.paidAt.lt = end;
      }
    }

    const orders = await this.prisma.kyoskOrder.findMany({
      where,
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
            email: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    // Calculate summary
    const totalSales = orders.length;
    const totalPoints = orders.reduce((sum, order) => sum + order.totalPoints, 0);
    const totalItems = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    return {
      kyosk: {
        id: kyosk.id,
        name: kyosk.name,
      },
      summary: {
        totalSales,
        totalPoints,
        totalItems,
      },
      orders: orders.map((order) => ({
        id: order.id,
        totalPoints: order.totalPoints,
        paidAt: order.paidAt,
        paidByUser: order.paidByUser,
        items: order.items.map((item) => ({
          productName: item.kyoskProduct.name,
          quantity: item.quantity,
          pointsPrice: item.pointsPrice,
        })),
      })),
    };
  }

  async exportSalesCsv(kyoskId: string, query: SalesQuery): Promise<string> {
    const salesData = await this.getSales(kyoskId, query);

    const headers = [
      'Data',
      'Usuario',
      'Email',
      'Produtos',
      'Quantidade Total',
      'Total Pontos',
    ];

    const rows = salesData.orders.map((order) => {
      const productsList = order.items
        .map((item) => `${item.quantity}x ${item.productName}`)
        .join('; ');
      const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0);

      return [
        order.paidAt ? new Date(order.paidAt).toLocaleString('pt-BR') : '',
        order.paidByUser?.name || '',
        order.paidByUser?.email || '',
        productsList,
        totalQuantity.toString(),
        order.totalPoints.toString(),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return '\uFEFF' + csvContent; // Add BOM for Excel UTF-8
  }
}
