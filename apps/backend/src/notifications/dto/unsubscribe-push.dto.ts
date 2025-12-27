import { IsString, IsNotEmpty } from 'class-validator';

export class UnsubscribePushDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}
