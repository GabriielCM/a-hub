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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto';

@Controller('kyosk/:kyoskId/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Param('kyoskId') kyoskId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(kyoskId, dto);
  }

  @Get()
  findAll(@Param('kyoskId') kyoskId: string) {
    return this.productsService.findAll(kyoskId);
  }

  @Get(':id')
  findById(@Param('kyoskId') kyoskId: string, @Param('id') id: string) {
    return this.productsService.findById(kyoskId, id);
  }

  @Patch(':id')
  update(
    @Param('kyoskId') kyoskId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(kyoskId, id, dto);
  }

  @Delete(':id')
  delete(@Param('kyoskId') kyoskId: string, @Param('id') id: string) {
    return this.productsService.delete(kyoskId, id);
  }

  @Post(':id/stock')
  adjustStock(
    @Param('kyoskId') kyoskId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(kyoskId, id, dto);
  }

  @Patch(':id/status')
  toggleStatus(@Param('kyoskId') kyoskId: string, @Param('id') id: string) {
    return this.productsService.toggleStatus(kyoskId, id);
  }
}
