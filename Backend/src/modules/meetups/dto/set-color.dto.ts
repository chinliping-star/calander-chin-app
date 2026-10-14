import { IsOptional, Matches, ValidateIf } from 'class-validator';

export class SetColorDto {
  /** Hex colour like #ff7fb1, or null to go back to the default colour. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a hex colour like #ff7fb1' })
  color: string | null;
}
