import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetupsController } from './meetups.controller';
import { MeetupsService } from './meetups.service';
import { Meetup, MeetupSchema } from './schemas/meetup.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CalendarDay, CalendarDaySchema } from '../calendar/schemas/calendar-day.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meetup.name, schema: MeetupSchema },
      { name: User.name, schema: UserSchema },
      { name: CalendarDay.name, schema: CalendarDaySchema },
    ]),
    NotificationsModule,
    ActivityModule,
  ],
  controllers: [MeetupsController],
  providers: [MeetupsService],
  exports: [MeetupsService, MongooseModule],
})
export class MeetupsModule {}
