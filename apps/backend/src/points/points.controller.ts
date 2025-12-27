import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { TransferPointsDto } from './dto/transfer-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
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
}
