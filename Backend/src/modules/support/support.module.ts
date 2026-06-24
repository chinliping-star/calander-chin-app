import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupportTicket, SupportTicketSchema,
  SupportChat, SupportChatSchema,
} from './schemas/support.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: SupportChat.name,   schema: SupportChatSchema },
      { name: User.name,          schema: UserSchema },
    ]),
  ],
  providers:   [SupportService],
  controllers: [SupportController],
  exports:     [SupportService],
})
export class SupportModule {}
