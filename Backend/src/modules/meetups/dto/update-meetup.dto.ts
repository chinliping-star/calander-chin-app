import {
  IsString,
  IsOptional,
  IsArray,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Editable fields of a meetup. Proposer-only. */
export class UpdateMeetupDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  /** Full set of extra invited friends (excludes proposer/owner). Replaces the current invite list. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];
}
