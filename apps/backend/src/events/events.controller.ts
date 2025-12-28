import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { EventsService } from './events.service';
import { QRService } from './qr.service';
import { CheckinService } from './checkin.service';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  CheckinDto,
  EventQueryDto,
} from './dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly qrService: QRService,
    private readonly checkinService: CheckinService,
  ) {}

  // ==================== Admin Endpoints ====================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateEventDto, @CurrentUser('sub') userId: string) {
    return this.eventsService.create(dto, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query() query: EventQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateStatus(id, dto.status);
  }

  @Get(':id/qr/current')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DISPLAY)
  getCurrentQR(@Param('id') id: string) {
    return this.qrService.getCurrentToken(id);
  }

  // ==================== User Endpoints ====================

  @Get('user/available')
  getAvailable() {
    return this.eventsService.getAvailable();
  }

  @Get('user/events')
  getUserEvents(@CurrentUser('sub') userId: string) {
    return this.eventsService.getUserEvents(userId);
  }

  @Post('checkin')
  checkin(@Body() dto: CheckinDto, @CurrentUser('sub') userId: string) {
    return this.checkinService.processCheckin(userId, dto.qrPayload);
  }

  @Get(':id/my-checkins')
  getMyCheckins(
    @Param('id') eventId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.checkinService.getUserCheckins(eventId, userId);
  }

  @Get(':id/checkin-status')
  getCheckinStatus(
    @Param('id') eventId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.checkinService.getEventCheckinStatus(eventId, userId);
  }
}
