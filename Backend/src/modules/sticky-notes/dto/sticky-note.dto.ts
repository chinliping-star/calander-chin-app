import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NOTE_COLORS } from '../schemas/sticky-note.schema';

export class UpdateStickyNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  body?: string;

  @IsOptional()
  @IsIn(NOTE_COLORS as unknown as string[])
  color?: string;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  /** null clears the lock (show everywhere); a string locks to that route. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(200)
  pinned_path?: string | null;
}
