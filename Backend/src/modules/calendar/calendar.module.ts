import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarDay, CalendarDaySchema } from './schemas/calendar-day.schema';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarDay.name, schema: CalendarDaySchema },
      { name: Meetup.name, schema: MeetupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
