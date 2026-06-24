import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { Community, CommunitySchema } from '../communities/schemas/community.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { ReportsModule } from '../reports/reports.module';
import { AuditModule } from '../audit/audit.module';
import { SettingsModule } from '../settings/settings.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,      schema: UserSchema },
      { name: Post.name,      schema: PostSchema },
      { name: Meetup.name,    schema: MeetupSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
    ReportsModule,
    AuditModule,
    SettingsModule,
    SupportModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
