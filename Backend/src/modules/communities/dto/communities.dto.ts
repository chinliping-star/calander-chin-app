import {
  IsString, IsBoolean, IsOptional, MaxLength, MinLength, Matches,
} from 'class-validator';

export class CreateCommunityDto {
  @IsString() @MinLength(2) @MaxLength(60)
  name: string;

  @IsString() @MinLength(2) @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug: lowercase letters, numbers, hyphens only' })
  slug: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsString()
  avatar_url?: string;

  @IsOptional() @IsString()
  banner_url?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsBoolean()
  is_private?: boolean;
}

export class UpdateCommunityDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(60)
  name?: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsString()
  avatar_url?: string;

  @IsOptional() @IsString()
  banner_url?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsBoolean()
  is_private?: boolean;
}

export class CreatePostDto {
  @IsString() @MinLength(1) @MaxLength(5000)
  content: string;

  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsString()
  type?: 'post' | 'announcement' | 'event';

  @IsOptional() @IsString()
  image_url?: string;

  @IsOptional() @IsString()
  event_date?: string;

  @IsOptional() @IsString()
  event_location?: string;
}

export class UpdateRoleDto {
  @IsString()
  role: 'moderator' | 'member';
}
