import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  photos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
