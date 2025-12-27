import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  storeItemId: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;
}
