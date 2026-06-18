import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getFriends(@CurrentUser('sub') userId: string) {
    return this.friendshipsService.getFriends(userId);
  }

  @Get('requests')
  @HttpCode(HttpStatus.OK)
  async getRequests(@CurrentUser('sub') userId: string) {
    return this.friendshipsService.getIncomingRequests(userId);
  }

  @Get('archived')
  @HttpCode(HttpStatus.OK)
  async getArchived(@CurrentUser('sub') userId: string) {
    return this.friendshipsService.getArchived(userId);
  }

  @Get('outgoing')
  @HttpCode(HttpStatus.OK)
  async getOutgoing(@CurrentUser('sub') userId: string) {
    return this.friendshipsService.getOutgoingRequests(userId);
  }

  @Get('mutual/:userId')
  @HttpCode(HttpStatus.OK)
  async getMutual(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.friendshipsService.getMutualFriends(currentUserId, otherUserId);
  }

  @Post('request/:userId')
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.friendshipsService.sendRequest(currentUserId, targetUserId);
  }

  @Patch('accept/:userId')
  @HttpCode(HttpStatus.OK)
  async acceptRequest(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') requesterId: string,
  ) {
    return this.friendshipsService.acceptRequest(currentUserId, requesterId);
  }

  @Delete('withdraw/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdrawRequest(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') recipientId: string,
  ) {
    await this.friendshipsService.withdrawRequest(currentUserId, recipientId);
  }

  @Delete('reject/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectRequest(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') requesterId: string,
  ) {
    await this.friendshipsService.rejectRequest(currentUserId, requesterId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') friendId: string,
  ) {
    await this.friendshipsService.removeFriend(currentUserId, friendId);
  }

  @Post('block/:userId')
  @HttpCode(HttpStatus.CREATED)
  async blockUser(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.friendshipsService.blockUser(currentUserId, targetUserId);
  }
}
