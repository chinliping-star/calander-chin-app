import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from './schemas/community.schema';
import { CommunityMember, CommunityMemberSchema } from './schemas/community-member.schema';
import { CommunityPost, CommunityPostSchema } from './schemas/community-post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityMember.name, schema: CommunityMemberSchema },
      { name: CommunityPost.name, schema: CommunityPostSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ActivityModule,
  ],
  providers: [CommunitiesService],
  controllers: [CommunitiesController],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
