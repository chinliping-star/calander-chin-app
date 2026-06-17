import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { IsString, IsIn } from 'class-validator';

class CreateCheckoutDto {
  @IsString() @IsIn(['monthly', 'yearly'])
  plan: 'monthly' | 'yearly';
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() clerkId: string, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckout(clerkId, dto.plan);
  }

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionsService.handleWebhook(req.rawBody!, sig);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() clerkId: string) {
    return this.subscriptionsService.getMe(clerkId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() clerkId: string) {
    return this.subscriptionsService.cancel(clerkId);
  }
}
