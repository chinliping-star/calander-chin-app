import { IsString, IsEnum, Matches } from 'class-validator';

export class MarkDayDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @IsEnum(['available', 'blocked'])
  status: 'available' | 'blocked';
}
