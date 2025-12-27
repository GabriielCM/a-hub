import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SpacesModule } from './spaces/spaces.module';
import { BookingsModule } from './bookings/bookings.module';
import { UploadModule } from './upload/upload.module';
import { MemberCardsModule } from './member-cards/member-cards.module';
import { BenefitsModule } from './benefits/benefits.module';
import { PointsModule } from './points/points.module';
import { StoreModule } from './store/store.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SpacesModule,
    BookingsModule,
    UploadModule,
    MemberCardsModule,
    BenefitsModule,
    PointsModule,
    StoreModule,
    CartModule,
    OrdersModule,
    PostsModule,
  ],
})
export class AppModule {}
