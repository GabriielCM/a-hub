import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { EventsReportService } from './report.service';
import { EventReportQueryDto } from './dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportController {
  constructor(private readonly reportService: EventsReportService) {}

  @Get('admin/summary')
  getEventsSummary(@Query() query: EventReportQueryDto) {
    return this.reportService.getEventsSummary(query);
  }

  @Get(':id/report')
  getEventReport(
    @Param('id') eventId: string,
    @Query() query: EventReportQueryDto,
  ) {
    return this.reportService.getEventReport(eventId, query);
  }

  @Get(':id/report/csv')
  @Header('Content-Type', 'text/csv')
  async exportCsv(
    @Param('id') eventId: string,
    @Query() query: EventReportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportService.exportCsv(eventId, query);
    const filename = `evento_${eventId}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
