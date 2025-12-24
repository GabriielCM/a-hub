import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateMemberCardDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @Min(1, { message: 'Matricula must be at least 1' })
  @Max(9999, { message: 'Matricula must be at most 9999 (4 digits)' })
  matricula: number;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Photo must be a valid URL' })
  photo?: string;
}
