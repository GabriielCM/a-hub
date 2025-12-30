import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SalesService, SalesQuery } from './sales.service';

@Controller('kyosk/:kyoskId/sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  getSales(@Param('kyoskId') kyoskId: string, @Query() query: SalesQuery) {
    return this.salesService.getSales(kyoskId, query);
  }

  @Get('export')
  async exportSalesCsv(
    @Param('kyoskId') kyoskId: string,
    @Query() query: SalesQuery,
    @Res() res: Response,
  ) {
    const csvContent = await this.salesService.exportSalesCsv(kyoskId, query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=kyosk-vendas-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csvContent);
  }
}
