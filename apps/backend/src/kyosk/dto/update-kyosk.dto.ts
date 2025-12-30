import { IsString, IsOptional, MaxLength, IsInt, Min, IsEnum } from 'class-validator';
import { KyoskStatus } from '@prisma/client';

export class UpdateKyoskDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(KyoskStatus)
  status?: KyoskStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  lowStockThreshold?: number;
}
