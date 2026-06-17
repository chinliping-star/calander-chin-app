import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryProvider } from '../../common/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meetup.name, schema: MeetupSchema },
      { name: User.name,   schema: UserSchema },
    ]),
  ],
  controllers: [MemoryController],
  providers: [MemoryService, CloudinaryProvider, CloudinaryService],
})
export class MemoryModule {}
