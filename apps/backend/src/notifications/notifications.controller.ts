import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get VAPID public key (no auth required)
   */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  /**
   * Subscribe to push notifications
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubscribePushDto,
  ) {
    return this.notificationsService.subscribe(userId, dto);
  }

  /**
   * Unsubscribe from push notifications
   */
  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UnsubscribePushDto,
  ) {
    return this.notificationsService.unsubscribe(userId, dto.endpoint);
  }

  /**
   * Unsubscribe all devices
   */
  @Delete('unsubscribe-all')
  @UseGuards(JwtAuthGuard)
  unsubscribeAll(@CurrentUser('sub') userId: string) {
    return this.notificationsService.unsubscribeAll(userId);
  }
}
