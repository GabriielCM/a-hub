import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
