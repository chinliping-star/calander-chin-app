import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  feed(@CurrentUser() clerkId: string, @Query('page') page?: string) {
    return this.activityService.getFeed(clerkId, page ? parseInt(page, 10) : 1);
  }

  @Get('users/:username')
  getUserActivity(@Param('username') username: string, @Query('page') page?: string) {
    return this.activityService.getUserActivity(username, page ? parseInt(page, 10) : 1);
  }
}
