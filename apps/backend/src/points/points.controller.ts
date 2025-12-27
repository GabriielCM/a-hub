import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PointsService } from './points.service';
import { TransferPointsDto } from './dto/transfer-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdminTransactionsQueryDto } from './dto/admin-transactions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * Get the current user's points balance
   */
  @Get('balance')
  getBalance(@CurrentUser('sub') userId: string) {
    return this.pointsService.getBalance(userId);
  }

  /**
   * Get the current user's transaction history
   */
  @Get('history')
  getHistory(@CurrentUser('sub') userId: string) {
    return this.pointsService.getHistory(userId);
  }

  /**
   * Transfer points to another user
   */
  @Post('transfer')
  transfer(
    @CurrentUser('sub') fromUserId: string,
    @Body() transferPointsDto: TransferPointsDto,
  ) {
    return this.pointsService.transfer(fromUserId, transferPointsDto);
  }

  /**
   * Admin: Adjust a user's points (add or subtract)
   */
  @Post('adjust/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  adjust(
    @Param('userId') userId: string,
    @Body() adjustPointsDto: AdjustPointsDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.pointsService.adjust(userId, adjustPointsDto, adminId);
  }

  /**
   * Admin: Get all transactions with optional filters
   */
  @Get('admin/transactions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAdminTransactions(@Query() query: AdminTransactionsQueryDto) {
    return this.pointsService.getAdminTransactions(query);
  }

  /**
   * Admin: Get all user balances
   */
  @Get('admin/balances')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAdminBalances() {
    return this.pointsService.getAdminBalances();
  }

  /**
   * Admin: Get system summary
   */
  @Get('admin/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getSystemSummary() {
    return this.pointsService.getSystemSummary();
  }

  /**
   * Admin: Export transactions to CSV
   */
  @Get('admin/export')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async exportCsv(@Query() query: AdminTransactionsQueryDto, @Res() res: Response) {
    const csvContent = await this.pointsService.exportTransactionsCsv(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pontos_${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csvContent);
  }
}
