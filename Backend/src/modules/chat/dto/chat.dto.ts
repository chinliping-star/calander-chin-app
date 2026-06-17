import { IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreatePrivateChatDto {
  @IsString()
  recipientId: string; // MongoDB ObjectId of recipient
}

export class CreateGroupChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[]; // MongoDB ObjectIds

  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class AddMemberDto {
  @IsString()
  userId: string;
}
