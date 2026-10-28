import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
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

  /** "Good user" badge. */
  @IsOptional()
  @IsBoolean()
  is_trusted?: boolean;
}

export class AdjustCoinsDto {
  /** + to give, - to take away. */
  @IsInt()
  @Min(-100000)
  @Max(100000)
  amount: number;

  @IsString()
  @MaxLength(200)
  note: string;
}

export class AddAdminDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}
