import {
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsDateString,
} from 'class-validator';

export class ModerateUserDto {
  @IsOptional()
  @IsIn(['active', 'suspended', 'blocked'])
  status?: 'active' | 'suspended' | 'blocked';

  @IsOptional()
  @IsDateString()
  suspended_until?: string | null;

  @IsOptional()
  @IsString()
  moderation_reason?: string;

  @IsOptional()
  @IsIn(['user', 'moderator', 'admin'])
  role?: 'user' | 'moderator' | 'admin';

  @IsOptional()
  @IsBoolean()
  is_premium?: boolean;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;
}
