import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() clerkId: string) {
    return this.analyticsService.getOverview(clerkId);
  }

  @Get('profile-views')
  profileViews(@CurrentUser() clerkId: string, @Query('period') period?: string) {
    return this.analyticsService.getProfileViews(clerkId, (period as 'daily' | 'weekly' | 'monthly') ?? 'weekly');
  }

  @Get('who-viewed')
  whoViewed(@CurrentUser() clerkId: string) {
    return this.analyticsService.getWhoViewed(clerkId);
  }

  @Get('friend-requests')
  friendRequests(@CurrentUser() clerkId: string, @Query('period') period?: string) {
    return this.analyticsService.getFriendRequestStats(clerkId, (period as 'daily' | 'weekly' | 'monthly') ?? 'weekly');
  }

  @Get('meetup-requests')
  meetupRequests(@CurrentUser() clerkId: string, @Query('period') period?: string) {
    return this.analyticsService.getMeetupRequestStats(clerkId, (period as 'daily' | 'weekly' | 'monthly') ?? 'weekly');
  }
}
