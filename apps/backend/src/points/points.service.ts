import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TransferPointsDto } from './dto/transfer-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdminTransactionsQueryDto } from './dto/admin-transactions-query.dto';
import { PointsTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get or create the points balance for a user
   * @param userId - User ID
   * @returns PointsBalance with balance and user info
   */
  async getBalance(userId: string) {
    let pointsBalance = await this.prisma.pointsBalance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // If balance doesn't exist, create it with 0 balance
    if (!pointsBalance) {
      // Verify user exists first
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      pointsBalance = await this.prisma.pointsBalance.create({
        data: {
          userId,
          balance: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    }

    return pointsBalance;
  }

  /**
   * Get transaction history for a user
   * @param userId - User ID
   * @returns Array of transactions ordered by date descending
   */
  async getHistory(userId: string) {
    const pointsBalance = await this.prisma.pointsBalance.findUnique({
      where: { userId },
    });

    if (!pointsBalance) {
      // Return empty array if user has no balance record yet
      return [];
    }

    return this.prisma.pointsTransaction.findMany({
      where: { pointsBalanceId: pointsBalance.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Transfer points from one user to another
   * @param fromUserId - ID of the user sending points
   * @param dto - Transfer details
   * @returns The two created transactions
   */
  async transfer(fromUserId: string, dto: TransferPointsDto) {
    const { toUserId, amount, description } = dto;

    // Validate that sender and receiver are different
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot transfer points to yourself');
    }

    // Verify recipient exists
    const recipientUser = await this.prisma.user.findUnique({
      where: { id: toUserId },
    });

    if (!recipientUser) {
      throw new NotFoundException('Recipient user not found');
    }

    // Get or create sender's balance
    const senderBalance = await this.getBalance(fromUserId);

    // Validate sufficient balance
    if (senderBalance.balance < amount) {
      throw new BadRequestException(
        `Insufficient balance. Current balance: ${senderBalance.balance}, required: ${amount}`,
      );
    }

    // Get or create recipient's balance
    const recipientBalance = await this.getBalance(toUserId);

    const transferDescription = description || `Transfer to ${recipientUser.name}`;

    // Execute transfer in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Debit from sender
      const updatedSenderBalance = await tx.pointsBalance.update({
        where: { id: senderBalance.id },
        data: { balance: { decrement: amount } },
      });

      const outTransaction = await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: senderBalance.id,
          type: PointsTransactionType.TRANSFER_OUT,
          amount: -amount,
          description: transferDescription,
          relatedUserId: toUserId,
        },
      });

      // Credit to recipient
      const updatedRecipientBalance = await tx.pointsBalance.update({
        where: { id: recipientBalance.id },
        data: { balance: { increment: amount } },
      });

      const inTransaction = await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: recipientBalance.id,
          type: PointsTransactionType.TRANSFER_IN,
          amount: amount,
          description: `Transfer from ${senderBalance.user.name}`,
          relatedUserId: fromUserId,
        },
      });

      return {
        senderBalance: updatedSenderBalance.balance,
        recipientBalance: updatedRecipientBalance.balance,
        outTransaction,
        inTransaction,
      };
    });

    // Send push notification to recipient
    this.notificationsService
      .notifyPointsReceived(toUserId, senderBalance.user.name, amount)
      .catch((err) => {
        // Log but don't fail the transfer if notification fails
        console.error('Failed to send push notification:', err);
      });

    return {
      message: 'Transfer completed successfully',
      ...result,
    };
  }

  /**
   * Admin adjustment of user points
   * @param userId - ID of the user to adjust
   * @param dto - Adjustment details
   * @param adminId - ID of the admin making the adjustment
   * @returns Updated balance and transaction
   */
  async adjust(userId: string, dto: AdjustPointsDto, adminId: string) {
    const { amount, reason } = dto;

    if (amount === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    // Get or create user's balance
    const userBalance = await this.getBalance(userId);

    // Check if adjustment would result in negative balance
    if (userBalance.balance + amount < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative balance. Current balance: ${userBalance.balance}, adjustment: ${amount}`,
      );
    }

    // Execute adjustment
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.pointsBalance.update({
        where: { id: userBalance.id },
        data: {
          balance: { increment: amount },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      const transaction = await tx.pointsTransaction.create({
        data: {
          pointsBalanceId: userBalance.id,
          type: PointsTransactionType.ADJUSTMENT,
          amount: amount,
          description: reason,
          relatedUserId: adminId,
        },
      });

      return {
        balance: updatedBalance,
        transaction,
      };
    });

    return {
      message: `Points ${amount > 0 ? 'added' : 'deducted'} successfully`,
      ...result,
    };
  }

  /**
   * Admin: Get all transactions with optional filters
   * @param query - Filter options (startDate, endDate, userId, type)
   * @returns Array of transactions with user info
   */
  async getAdminTransactions(query: AdminTransactionsQueryDto) {
    const { startDate, endDate, userId, type } = query;

    const where: Prisma.PointsTransactionWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    if (userId) {
      where.pointsBalance = { userId };
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.pointsTransaction.findMany({
      where,
      include: {
        pointsBalance: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: Get all user balances
   * @returns Array of balances with user info, ordered by balance descending
   */
  async getAdminBalances() {
    return this.prisma.pointsBalance.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { balance: 'desc' },
    });
  }

  /**
   * Admin: Get system summary (total points and user count)
   * @returns Object with totalPoints and totalUsers
   */
  async getSystemSummary() {
    const aggregate = await this.prisma.pointsBalance.aggregate({
      _sum: { balance: true },
      _count: true,
    });

    return {
      totalPoints: aggregate._sum.balance || 0,
      totalUsers: aggregate._count,
    };
  }

  /**
   * Admin: Export transactions to CSV format
   * @param query - Filter options
   * @returns CSV string content
   */
  async exportTransactionsCsv(query: AdminTransactionsQueryDto) {
    const transactions = await this.getAdminTransactions(query);

    const typeLabels: Record<PointsTransactionType, string> = {
      CREDIT: 'Credito',
      DEBIT: 'Debito',
      TRANSFER_IN: 'Transferencia Recebida',
      TRANSFER_OUT: 'Transferencia Enviada',
      ADJUSTMENT: 'Ajuste',
      EVENT_CHECKIN: 'Check-in Evento',
    };

    const headers = [
      'Data',
      'Usuario',
      'Email',
      'Tipo',
      'Quantidade',
      'Descricao',
      'Usuario Relacionado',
    ];

    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleString('pt-BR'),
      t.pointsBalance.user.name,
      t.pointsBalance.user.email,
      typeLabels[t.type],
      t.amount.toString(),
      `"${t.description.replace(/"/g, '""')}"`,
      t.relatedUserId || '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
