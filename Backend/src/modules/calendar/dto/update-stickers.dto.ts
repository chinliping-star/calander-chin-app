import { IsString, IsArray, Matches, ArrayMaxSize } from 'class-validator';

export class UpdateStickersDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(6)
  stickers: string[];
}
