import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreatePrivateChatDto, CreateGroupChatDto, AddMemberDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() clerkId: string) {
    return this.chatService.getConversations(clerkId);
  }

  @Post('conversations')
  createPrivate(
    @CurrentUser() clerkId: string,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return this.chatService.createPrivateChat(clerkId, dto);
  }

  @Post('conversations/group')
  createGroup(
    @CurrentUser() clerkId: string,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatService.createGroupChat(clerkId, dto);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() clerkId: string,
    @Param('id') convId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(clerkId, convId, before, limit ? parseInt(limit, 10) : 50);
  }

  @Post('conversations/:id/members')
  addMember(
    @CurrentUser() clerkId: string,
    @Param('id') convId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.chatService.addMember(clerkId, convId, dto.userId);
  }

  @Delete('conversations/:id/members/:userId')
  removeMember(
    @CurrentUser() clerkId: string,
    @Param('id') convId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.removeMember(clerkId, convId, userId);
  }

  @Get('unread')
  getUnreadCount(@CurrentUser() clerkId: string) {
    return this.chatService.getUnreadCount(clerkId).then(count => ({ count }));
  }
}
