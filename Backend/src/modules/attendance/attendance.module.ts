import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: User.name,       schema: UserSchema },
      { name: Meetup.name,     schema: MeetupSchema },
    ]),
  ],
  providers:   [AttendanceService],
  controllers: [AttendanceController],
  exports:     [AttendanceService],
})
export class AttendanceModule {}
