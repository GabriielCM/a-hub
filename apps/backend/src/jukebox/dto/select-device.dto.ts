import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SelectDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
