import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  IsInt,
  IsPositive,
  Min,
  MaxLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateStoreItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pointsPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsDateString()
  offerEndsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
