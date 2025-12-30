import { Module } from '@nestjs/common';
import { KyoskController } from './kyosk.controller';
import { ProductsController } from './products.controller';
import { DisplayController } from './display.controller';
import { PaymentController } from './payment.controller';
import { SalesController } from './sales.controller';
import { KyoskService } from './kyosk.service';
import { ProductsService } from './products.service';
import { KyoskQRService } from './qr.service';
import { DisplayService } from './display.service';
import { PaymentService } from './payment.service';
import { SalesService } from './sales.service';

@Module({
  controllers: [
    KyoskController,
    ProductsController,
    DisplayController,
    PaymentController,
    SalesController,
  ],
  providers: [
    KyoskService,
    ProductsService,
    KyoskQRService,
    DisplayService,
    PaymentService,
    SalesService,
  ],
  exports: [KyoskService, PaymentService],
})
export class KyoskModule {}
