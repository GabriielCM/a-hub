import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { QRService } from './qr.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class DisplayController {
  constructor(private readonly qrService: QRService) {}

  @Get(':id/display')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DISPLAY)
  getDisplayData(@Param('id') id: string) {
    return this.qrService.getDisplayData(id);
  }
}
