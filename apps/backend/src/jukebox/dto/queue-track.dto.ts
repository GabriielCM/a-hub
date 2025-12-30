import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional, MaxLength } from 'class-validator';

export class QueueTrackDto {
  @IsString()
  @IsNotEmpty()
  trackId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  trackName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  artistName: string;

  @IsInt()
  @IsPositive()
  durationMs: number;

  @IsOptional()
  @IsString()
  albumImage?: string;
}
