import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { Post, PostSchema } from './schemas/post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Friendship, FriendshipSchema } from '../friendships/schemas/friendship.schema';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CloudinaryProvider } from '../../common/cloudinary/cloudinary.provider';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MulterModule.register({ storage: undefined }),
    MongooseModule.forFeature([
      { name: Post.name,       schema: PostSchema },
      { name: User.name,       schema: UserSchema },
      { name: Friendship.name, schema: FriendshipSchema },
    ]),
    ActivityModule,
  ],
  providers: [PostsService, CloudinaryProvider, CloudinaryService, OptionalJwtAuthGuard],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
