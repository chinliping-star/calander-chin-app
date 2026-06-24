import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: string;

  @IsOptional()
  @IsIn(['all', 'premium', 'admins'])
  audience?: string;

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsOptional()
  @IsDateString()
  publish_at?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string | null;
}

export class UpdateAnnouncementDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsIn(['low', 'normal', 'high']) priority?: string;
  @IsOptional() @IsIn(['all', 'premium', 'admins']) audience?: string;
  @IsOptional() @IsBoolean() is_pinned?: boolean;
  @IsOptional() @IsDateString() publish_at?: string;
  @IsOptional() @IsDateString() expires_at?: string | null;
}
