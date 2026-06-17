import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() clerkId: string) {
    return this.svc.getForUser(clerkId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() clerkId: string) {
    return this.svc.getUnreadCount(clerkId).then(count => ({ count }));
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() clerkId: string) {
    return this.svc.markAllRead(clerkId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() clerkId: string, @Param('id') id: string) {
    return this.svc.markRead(clerkId, id);
  }
}
