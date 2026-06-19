import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class PostShoutDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  body: string;
}
