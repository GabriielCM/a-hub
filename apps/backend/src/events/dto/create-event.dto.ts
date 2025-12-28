import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(1)
  totalPoints: number;

  @IsBoolean()
  allowMultipleCheckins: boolean;

  @ValidateIf((o) => o.allowMultipleCheckins === true)
  @IsInt()
  @Min(1)
  @Max(100)
  maxCheckinsPerUser?: number;

  @ValidateIf((o) => o.allowMultipleCheckins === true)
  @IsInt()
  @Min(60)
  @Max(86400)
  checkinIntervalSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  displayBackgroundColor?: string;

  @IsOptional()
  @IsUrl()
  displayLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayLayout?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  qrRotationSeconds?: number;
}
