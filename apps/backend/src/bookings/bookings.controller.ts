import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  findAllByUser(@CurrentUser('sub') userId: string) {
    return this.bookingsService.findAllByUser(userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async exportToCsv(@Res() res: Response) {
    const csvContent = await this.bookingsService.exportToCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bookings-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csvContent);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.updateStatus(
      id,
      updateBookingDto,
      userId,
      userRole,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.remove(id, userId, userRole);
  }
}
