import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ShoutboxMessage,
  ShoutboxMessageSchema,
} from './schemas/shoutbox-message.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Friendship,
  FriendshipSchema,
} from '../friendships/schemas/friendship.schema';
import { ShoutboxService } from './shoutbox.service';
import { ShoutboxController } from './shoutbox.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShoutboxMessage.name, schema: ShoutboxMessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Friendship.name, schema: FriendshipSchema },
    ]),
  ],
  providers: [ShoutboxService],
  controllers: [ShoutboxController],
  exports: [ShoutboxService],
})
export class ShoutboxModule {}
