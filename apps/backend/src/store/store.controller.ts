import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /**
   * List all available store items (public)
   * Returns items that are active, not expired, and have stock > 0
   */
  @Get('items')
  findAll() {
    return this.storeService.findAll();
  }

  /**
   * Get store item details by ID (public)
   */
  @Get('items/:id')
  findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  /**
   * Create a new store item (admin only)
   */
  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createStoreItemDto: CreateStoreItemDto) {
    return this.storeService.create(createStoreItemDto);
  }

  /**
   * Update a store item (admin only)
   */
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateStoreItemDto: UpdateStoreItemDto) {
    return this.storeService.update(id, updateStoreItemDto);
  }

  /**
   * Delete a store item (admin only)
   * Performs a soft delete by setting isActive to false
   */
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }

  /**
   * Adjust stock for a store item (admin only)
   * Positive quantity = stock entry, negative = stock exit
   */
  @Post('items/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adjustStock(@Param('id') id: string, @Body() adjustStockDto: AdjustStockDto) {
    return this.storeService.adjustStock(id, adjustStockDto);
  }

  /**
   * Get stock movement history for a store item (admin only)
   */
  @Get('items/:id/stock-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getStockHistory(@Param('id') id: string) {
    return this.storeService.getStockHistory(id);
  }
}
