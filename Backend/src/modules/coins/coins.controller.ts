import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoinsService, COIN_REWARDS, type CoinReward } from './coins.service';

class RedeemDto {
  @IsIn(Object.keys(COIN_REWARDS))
  reward: CoinReward;
}

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  /** Balance, how to earn, what to buy, recent history. */
  @Get('me')
  getMine(@CurrentUser() clerkId: string) {
    return this.coinsService.getMine(clerkId);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeem(@CurrentUser() clerkId: string, @Body() dto: RedeemDto) {
    return this.coinsService.redeem(clerkId, dto.reward);
  }
}
