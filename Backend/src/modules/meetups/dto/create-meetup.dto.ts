import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMeetupDto {
  @IsString()
  owner_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @IsString()
  time: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];
}
