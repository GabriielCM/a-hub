import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferPointsDto } from './dto/transfer-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { PointsTransactionType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

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
}
