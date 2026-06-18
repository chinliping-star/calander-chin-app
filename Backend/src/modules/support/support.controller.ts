import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  contact(
    @CurrentUser() clerkId: string,
    @Body() dto: { name: string; email: string; subject: string; message: string },
  ) {
    return this.support.createTicket(clerkId, dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.CREATED)
  chat(
    @CurrentUser() clerkId: string,
    @Body() dto: { sessionId: string; from: 'user' | 'bot' | 'agent'; text: string; needsAgent?: boolean },
  ) {
    return this.support.saveChat(clerkId, dto);
  }
}
