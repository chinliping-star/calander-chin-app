import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { MarkDayDto } from './dto/mark-day.dto';
import { UpdateStickersDto } from './dto/update-stickers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get(':username')
  @HttpCode(HttpStatus.OK)
  async getMonth(
    @Param('username') username: string,
    @Query('month') month: string,
  ) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    return this.calendarService.getMonthCalendar(username, currentMonth);
  }

  @Patch('day')
  @HttpCode(HttpStatus.OK)
  async markDay(
    @CurrentUser('sub') userId: string,
    @Body() dto: MarkDayDto,
  ) {
    return this.calendarService.markDay(userId, dto);
  }

  @Patch('day/stickers')
  @HttpCode(HttpStatus.OK)
  async updateStickers(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateStickersDto,
  ) {
    return this.calendarService.updateStickers(userId, dto);
  }
}
