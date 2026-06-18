import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  mark(@CurrentUser() clerkId: string, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.mark(clerkId, dto);
  }

  // NOTE: 'me' routes must be declared before ':meetupId' so they aren't
  // swallowed by the param route.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  myAttendance(@CurrentUser() clerkId: string) {
    return this.attendanceService.getMyAttendance(clerkId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  myStats(@CurrentUser() clerkId: string) {
    return this.attendanceService.getUserStats(clerkId);
  }

  @Get(':meetupId')
  getForMeetup(@Param('meetupId') meetupId: string) {
    return this.attendanceService.getForMeetup(meetupId);
  }
}
