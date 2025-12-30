import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { DisplayService } from './display.service';
import { CreateOrderDto } from './dto';

@Controller('kyosk/:kyoskId/display')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISPLAY, Role.ADMIN)
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Get()
  getDisplayData(@Param('kyoskId') kyoskId: string) {
    return this.displayService.getDisplayData(kyoskId);
  }

  @Post('checkout')
  createOrder(@Param('kyoskId') kyoskId: string, @Body() dto: CreateOrderDto) {
    return this.displayService.createOrder(kyoskId, dto);
  }

  @Get('order/:orderId')
  getOrderStatus(
    @Param('kyoskId') kyoskId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.displayService.getOrderStatus(kyoskId, orderId);
  }

  @Delete('order/:orderId')
  cancelOrder(
    @Param('kyoskId') kyoskId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.displayService.cancelOrder(kyoskId, orderId);
  }
}
