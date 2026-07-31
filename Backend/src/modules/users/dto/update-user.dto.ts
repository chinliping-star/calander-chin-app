import { IsString, IsOptional, IsArray, IsBoolean, IsIn, MaxLength, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PrivacyDto {
  @IsOptional() @IsBoolean() private_account?: boolean;
  @IsOptional() @IsBoolean() friend_requests?: boolean;
  @IsOptional() @IsBoolean() discoverability?: boolean;
  @IsOptional() @IsBoolean() show_meetups?: boolean;
  @IsOptional() @IsIn(['mutual', 'all']) friend_list?: 'mutual' | 'all';
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(30) @Matches(/^[a-z0-9_\.]+$/, { message: 'Username may only contain lowercase letters, numbers, underscores, and dots' }) username?: string;
  @IsOptional() @IsString() @MaxLength(50)  display_name?: string;
  @IsOptional() @IsString() @MaxLength(50)  first_name?: string;
  @IsOptional() @IsString() @MaxLength(50)  last_name?: string;
  @IsOptional() @IsString() @MaxLength(60)  country?: string;
  @IsOptional() @IsString() @MaxLength(1000) @Matches(/^(?:\s*\S+){0,100}\s*$/, { message: 'Bio must be 100 words or fewer' }) bio?: string;
  @IsOptional() @IsString()                 theme?: string;
  @IsOptional() @IsString()                 banner_url?: string;
  @IsOptional() @IsString()                 avatar_url?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) interests?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) hobbies?: string[];
  @IsOptional() @IsBoolean() is_premium?: boolean;
  @IsOptional() @ValidateNested() @Type(() => PrivacyDto) privacy?: PrivacyDto;
}

export class OnboardingDto {
  @IsString() @MaxLength(30) username: string;
  @IsString() @MaxLength(50) display_name: string;
  @IsOptional() @IsString() @MaxLength(50)  first_name?: string;
  @IsOptional() @IsString() @MaxLength(50)  last_name?: string;
  @IsOptional() @IsString() @MaxLength(20)  phone?: string;
  @IsOptional() @IsString() @MaxLength(60)  country?: string;
  @IsOptional() @IsString() @MaxLength(100) heard_about?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) interests?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) hobbies?: string[];
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() avatar_url?: string;
}
