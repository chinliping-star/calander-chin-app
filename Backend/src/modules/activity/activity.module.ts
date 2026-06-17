import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Friendship, FriendshipSchema } from '../friendships/schemas/friendship.schema';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name,    schema: ActivitySchema },
      { name: User.name,        schema: UserSchema },
      { name: Friendship.name,  schema: FriendshipSchema },
    ]),
  ],
  providers:   [ActivityService],
  controllers: [ActivityController],
  exports:     [ActivityService],
})
export class ActivityModule {}
