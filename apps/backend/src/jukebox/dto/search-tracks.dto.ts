import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchTracksDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  q: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 5;
}
