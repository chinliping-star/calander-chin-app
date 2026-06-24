import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsIn(['user', 'post'])
  target_type: 'user' | 'post';

  @IsString()
  target_id: string;

  @IsIn(['spam', 'harassment', 'inappropriate', 'impersonation', 'other'])
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

export class ResolveReportDto {
  @IsIn(['reviewing', 'resolved', 'dismissed'])
  status: 'reviewing' | 'resolved' | 'dismissed';

  /** Optional moderation action to apply to the target on resolve. */
  @IsOptional()
  @IsIn(['none', 'warn', 'remove_content', 'suspend_user', 'block_user'])
  action?: 'none' | 'warn' | 'remove_content' | 'suspend_user' | 'block_user';
}
