import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileView, ProfileViewSchema } from './schemas/profile-view.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Friendship, FriendshipSchema } from '../friendships/schemas/friendship.schema';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfileView.name, schema: ProfileViewSchema },
      { name: User.name,        schema: UserSchema },
      { name: Friendship.name,  schema: FriendshipSchema },
      { name: Meetup.name,      schema: MeetupSchema },
    ]),
  ],
  providers:   [AnalyticsService],
  controllers: [AnalyticsController],
  exports:     [AnalyticsService],
})
export class AnalyticsModule {}
