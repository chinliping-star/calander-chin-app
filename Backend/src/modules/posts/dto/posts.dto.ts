import { IsString, IsOptional, IsIn, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString() @MinLength(1) @MaxLength(5000)
  content: string;

  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsIn(['text', 'image', 'event_memory', 'meetup_story'])
  type?: string;

  @IsOptional() @IsIn(['public', 'friends', 'private'])
  privacy?: string;

  @IsOptional() @IsString()
  meetup_ref?: string;
}

export class UpdatePostDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(5000)
  content?: string;

  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsIn(['public', 'friends', 'private'])
  privacy?: string;
}
