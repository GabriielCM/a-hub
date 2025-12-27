import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { PointsTransactionType } from '@prisma/client';

export class AdminTransactionsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(PointsTransactionType)
  type?: PointsTransactionType;
}
