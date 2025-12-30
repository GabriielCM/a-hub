import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsUrl, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsInt()
  @Min(1)
  pointsPrice: number;

  @IsInt()
  @Min(0)
  stock: number;
}
