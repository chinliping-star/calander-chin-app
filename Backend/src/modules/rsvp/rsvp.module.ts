import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rsvp, RsvpSchema } from './schemas/rsvp.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rsvp.name, schema: RsvpSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers:   [RsvpService],
  controllers: [RsvpController],
  exports:     [RsvpService],
})
export class RsvpModule {}
