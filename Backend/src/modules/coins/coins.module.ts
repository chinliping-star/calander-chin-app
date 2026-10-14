import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CoinTransaction, CoinTransactionSchema } from './schemas/coin-transaction.schema';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,            schema: UserSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
    ]),
  ],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
