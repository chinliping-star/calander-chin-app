import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { Friendship, FriendshipSchema } from '../friendships/schemas/friendship.schema';
import { Meetup, MeetupSchema } from '../meetups/schemas/meetup.schema';
import { Community, CommunitySchema } from '../communities/schemas/community.schema';
import { CommunityMember, CommunityMemberSchema } from '../communities/schemas/community-member.schema';
import { CommunityPost, CommunityPostSchema } from '../communities/schemas/community-post.schema';
import { Rsvp, RsvpSchema } from '../rsvp/schemas/rsvp.schema';
import { CloudinaryProvider } from '../../common/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: Meetup.name, schema: MeetupSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityMember.name, schema: CommunityMemberSchema },
      { name: CommunityPost.name, schema: CommunityPostSchema },
      { name: Rsvp.name, schema: RsvpSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryProvider, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
