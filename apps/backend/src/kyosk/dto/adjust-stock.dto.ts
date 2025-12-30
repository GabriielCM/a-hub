import { IsString, IsNotEmpty, IsInt, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;
}
