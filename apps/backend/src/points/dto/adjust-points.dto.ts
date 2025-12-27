import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class AdjustPointsDto {
  @IsInt()
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
