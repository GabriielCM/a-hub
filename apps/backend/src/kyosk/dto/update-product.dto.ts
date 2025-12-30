import { IsString, IsOptional, IsInt, Min, IsUrl, MaxLength, IsEnum } from 'class-validator';
import { KyoskProductStatus } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsPrice?: number;

  @IsOptional()
  @IsEnum(KyoskProductStatus)
  status?: KyoskProductStatus;
}
