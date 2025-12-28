import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { DisplayController } from './display.controller';
import { ReportController } from './report.controller';
import { EventsService } from './events.service';
import { QRService } from './qr.service';
import { CheckinService } from './checkin.service';
import { EventsReportService } from './report.service';

@Module({
  controllers: [EventsController, DisplayController, ReportController],
  providers: [EventsService, QRService, CheckinService, EventsReportService],
  exports: [EventsService, CheckinService],
})
export class EventsModule {}
