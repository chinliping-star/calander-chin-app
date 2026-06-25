import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProposalSlotDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'slot date must be YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}

export class CreateProposalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Candidate slots invitees vote between. 1–3. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ProposalSlotDto)
  slots: ProposalSlotDto[];

  /** Invited friends (the proposer is added automatically). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];
}
