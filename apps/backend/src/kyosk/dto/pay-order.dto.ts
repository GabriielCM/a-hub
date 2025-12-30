import { IsString, IsNotEmpty } from 'class-validator';

export class PayOrderDto {
  @IsString()
  @IsNotEmpty()
  qrPayload: string;
}
