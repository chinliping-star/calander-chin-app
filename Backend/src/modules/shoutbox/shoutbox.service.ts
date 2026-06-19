import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShoutboxMessage,
  ShoutboxMessageDocument,
} from './schemas/shoutbox-message.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Friendship,
  FriendshipDocument,
} from '../friendships/schemas/friendship.schema';
import { PostShoutDto } from './dto/shoutbox.dto';
import { effectivePremium } from '../../common/feature-flags';

const FREE_LIMIT = 10;
const PREMIUM_LIMIT = 15;

@Injectable()
export class ShoutboxService {
  constructor(
    @InjectModel(ShoutboxMessage.name)
    private readonly shoutModel: Model<ShoutboxMessageDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  /** Accepted-friend user ids for a given user. */
  private async friendIds(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const friendships = await this.friendshipModel
      .find({
        status: 'accepted',
        $or: [{ requester_id: userId }, { recipient_id: userId }],
      })
      .select('requester_id recipient_id')
      .exec();

    return friendships.map((f) =>
      f.requester_id.toString() === userId.toString()
        ? f.recipient_id
        : f.requester_id,
    );
  }

  /**
   * Shared friend feed: shouts written by the viewer or any of their friends.
   * Newest first up to the tier limit, returned oldest → newest for display.
   */
  async getFeed(viewerClerkId: string) {
    const viewer = await this.resolveUser(viewerClerkId);
    const viewerId = viewer._id as Types.ObjectId;
    const authors = [viewerId, ...(await this.friendIds(viewerId))];
    const limit = effectivePremium(viewer.is_premium) ? PREMIUM_LIMIT : FREE_LIMIT;

    const messages = await this.shoutModel
      .find({ author_id: { $in: authors } })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('author_id', 'username display_name avatar_url _id')
      .exec();

    return messages.reverse();
  }

  async postShout(authorClerkId: string, dto: PostShoutDto) {
    const author = await this.resolveUser(authorClerkId);
    const created = await this.shoutModel.create({
      author_id: author._id,
      body: dto.body.trim(),
    });
    return created.populate('author_id', 'username display_name avatar_url _id');
  }

  /** Author can delete own shout. */
  async deleteShout(clerkId: string, messageId: string) {
    const user = await this.resolveUser(clerkId);
    const msg = await this.shoutModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');

    if (msg.author_id.toString() !== (user._id as Types.ObjectId).toString()) {
      throw new ForbiddenException('Not allowed to delete this message');
    }

    await msg.deleteOne();
    return { deleted: true };
  }
}
