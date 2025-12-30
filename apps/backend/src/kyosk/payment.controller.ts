import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { PayOrderDto } from './dto';

@Controller('kyosk/pay')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('validate')
  validatePayment(@Body() dto: PayOrderDto) {
    return this.paymentService.validatePayment(dto.qrPayload);
  }

  @Post()
  processPayment(
    @CurrentUser('sub') userId: string,
    @Body() dto: PayOrderDto,
  ) {
    return this.paymentService.processPayment(userId, dto.qrPayload);
  }
}
