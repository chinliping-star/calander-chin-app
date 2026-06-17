import { IsString, IsIn } from 'class-validator';

export class MarkAttendanceDto {
  @IsString()
  meetupId: string;

  @IsString()
  @IsIn(['attended', 'missed', 'skipped'])
  status: string;
}
