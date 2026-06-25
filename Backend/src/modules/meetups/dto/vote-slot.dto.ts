import { IsString, IsOptional } from 'class-validator';

export class VoteSlotDto {
  @IsString()
  slot_id: string;
}

export class LockSlotDto {
  /** Omit to auto-lock the slot with the most votes. */
  @IsOptional()
  @IsString()
  slot_id?: string;
}
