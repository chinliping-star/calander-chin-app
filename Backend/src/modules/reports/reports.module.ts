import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name,   schema: UserSchema },
      { name: Post.name,   schema: PostSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ModerationService],
  exports: [ReportsService, ModerationService],
})
export class ReportsModule {}
