import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name,         schema: UserSchema },
    ]),
  ],
  providers:   [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports:     [SubscriptionsService],
})
export class SubscriptionsModule {}
