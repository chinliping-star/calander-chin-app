import { Controller, Post, Delete, Get, Param, Body, UseGuards } from '@nestjs/common';
import { IsString, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RsvpService } from './rsvp.service';

class RsvpDto {
  @IsString() @IsIn(['going', 'interested', 'not_going'])
  status: 'going' | 'interested' | 'not_going';
}

@Controller('rsvp')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Post(':eventId')
  @UseGuards(JwtAuthGuard)
  upsert(
    @CurrentUser() clerkId: string,
    @Param('eventId') eventId: string,
    @Body() dto: RsvpDto,
  ) {
    return this.rsvpService.upsert(clerkId, eventId, dto.status);
  }

  @Delete(':eventId')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() clerkId: string, @Param('eventId') eventId: string) {
    return this.rsvpService.remove(clerkId, eventId);
  }

  @Get(':eventId')
  getForEvent(@Param('eventId') eventId: string) {
    return this.rsvpService.getForEvent(eventId);
  }

  @Get(':eventId/me')
  @UseGuards(JwtAuthGuard)
  getMyRsvp(@CurrentUser() clerkId: string, @Param('eventId') eventId: string) {
    return this.rsvpService.getMyRsvp(clerkId, eventId);
  }
}
