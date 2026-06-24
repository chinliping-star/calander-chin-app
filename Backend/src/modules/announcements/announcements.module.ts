import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Announcement, AnnouncementSchema } from './schemas/announcement.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: User.name,         schema: UserSchema },
    ]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AdminGuard],
})
export class AnnouncementsModule {}
