import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  ShoutboxMessage,
  ShoutboxMessageDocument,
} from './schemas/shoutbox-message.schema';
import {
  PrivateShout,
  PrivateShoutDocument,
} from './schemas/private-shout.schema';
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
    @InjectModel(PrivateShout.name)
    private readonly privateShoutModel: Model<PrivateShoutDocument>,
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

  // ── Private shoutbox (exactly two friends) ────────────────────────────────

  /**
   * Resolves viewer + friend, checks they are accepted friends, and returns
   * the shared pair key. Throws if friendId is invalid, self, or not a friend.
   */
  private async resolvePair(clerkId: string, friendId: string) {
    const viewer = await this.resolveUser(clerkId);
    const viewerId = viewer._id as Types.ObjectId;

    if (!isValidObjectId(friendId)) {
      throw new BadRequestException('Invalid friend id');
    }
    if (viewerId.toString() === friendId) {
      throw new BadRequestException('Cannot shout to yourself');
    }

    const friendObjectId = new Types.ObjectId(friendId);
    const friendship = await this.friendshipModel
      .exists({
        status: 'accepted',
        $or: [
          { requester_id: viewerId, recipient_id: friendObjectId },
          { requester_id: friendObjectId, recipient_id: viewerId },
        ],
      })
      .exec();
    if (!friendship) {
      throw new ForbiddenException('You can only shout with friends');
    }

    const pairKey = [viewerId.toString(), friendId].sort().join('_');
    return { viewer, viewerId, pairKey };
  }

  /** Private thread between viewer and one friend, oldest → newest. */
  async getPrivateFeed(clerkId: string, friendId: string) {
    const { viewer, pairKey } = await this.resolvePair(clerkId, friendId);
    const limit = effectivePremium(viewer.is_premium) ? PREMIUM_LIMIT : FREE_LIMIT;

    const messages = await this.privateShoutModel
      .find({ pair_key: pairKey })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('author_id', 'username display_name avatar_url _id')
      .exec();

    return messages.reverse();
  }

  async postPrivateShout(clerkId: string, friendId: string, dto: PostShoutDto) {
    const { viewerId, pairKey } = await this.resolvePair(clerkId, friendId);
    const created = await this.privateShoutModel.create({
      pair_key: pairKey,
      author_id: viewerId,
      body: dto.body.trim(),
    });
    return created.populate('author_id', 'username display_name avatar_url _id');
  }

  /** Author can delete own private shout. */
  async deletePrivateShout(clerkId: string, messageId: string) {
    const user = await this.resolveUser(clerkId);
    if (!isValidObjectId(messageId)) {
      throw new NotFoundException('Message not found');
    }
    const msg = await this.privateShoutModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');

    if (msg.author_id.toString() !== (user._id as Types.ObjectId).toString()) {
      throw new ForbiddenException('Not allowed to delete this message');
    }

    await msg.deleteOne();
    return { deleted: true };
  }
}
