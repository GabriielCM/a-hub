import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { KyoskService } from './kyosk.service';
import { CreateKyoskDto, UpdateKyoskDto } from './dto';

@Controller('kyosk')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KyoskController {
  constructor(private readonly kyoskService: KyoskService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateKyoskDto) {
    return this.kyoskService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.kyoskService.findAll();
  }

  @Get('alerts/low-stock')
  @Roles(Role.ADMIN)
  getLowStockAlerts() {
    return this.kyoskService.getLowStockAlerts();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findById(@Param('id') id: string) {
    return this.kyoskService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateKyoskDto) {
    return this.kyoskService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.kyoskService.delete(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  toggleStatus(@Param('id') id: string) {
    return this.kyoskService.toggleStatus(id);
  }
}
