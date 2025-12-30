import { IsInt, IsOptional, IsPositive, Min, Max, IsBoolean } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  pointsPerSong?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(10)
  maxSongsPerUser?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(60000) // 1 minute minimum
  @Max(600000) // 10 minutes maximum
  maxDurationMs?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
