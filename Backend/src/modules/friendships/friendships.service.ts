import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Friendship, FriendshipDocument } from './schemas/friendship.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notifSvc: NotificationsService,
    private readonly activitySvc: ActivityService,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  async getFriends(clerkId: string) {
    const userObjId = await this.resolveMongoId(clerkId);

    const friendships = await this.friendshipModel
      .find({
        $or: [{ requester_id: userObjId }, { recipient_id: userObjId }],
        status: 'accepted',
      })
      .populate('requester_id', 'username display_name avatar_url theme _id')
      .populate('recipient_id', 'username display_name avatar_url theme _id')
      .exec();

    return friendships.flatMap((f) => {
      const requester = f.requester_id as unknown as UserDocument | null;
      const recipient = f.recipient_id as unknown as UserDocument | null;
      // A user may have been deleted — populate then yields null. Skip it.
      if (!requester || !recipient) return [];
      const isRequester = requester._id.toString() === userObjId.toString();
      const friend = isRequester ? recipient : requester;
      if (friend.username?.startsWith('__deleted__')) return [];
      return [{ friendship_id: f._id, friend, since: f.created_at }];
    });
  }

  /** Accepted-friend mongo ids for a given user. */
  private async friendIdsOf(userObjId: Types.ObjectId): Promise<string[]> {
    const friendships = await this.friendshipModel
      .find({
        $or: [{ requester_id: userObjId }, { recipient_id: userObjId }],
        status: 'accepted',
      })
      .select('requester_id recipient_id')
      .lean()
      .exec();

    return friendships.map((f) => {
      const reqId = f.requester_id.toString();
      const recId = f.recipient_id.toString();
      return reqId === userObjId.toString() ? recId : reqId;
    });
  }

  /** Friends shared between the current user and another user. */
  async getMutualFriends(clerkId: string, otherUserId: string) {
    const meObjId = await this.resolveMongoId(clerkId);
    const otherObjId = new Types.ObjectId(otherUserId);

    const [mine, theirs] = await Promise.all([
      this.friendIdsOf(meObjId),
      this.friendIdsOf(otherObjId),
    ]);

    const theirSet = new Set(theirs);
    const mutualIds = mine.filter((id) => theirSet.has(id));

    const users = await this.userModel
      .find({ _id: { $in: mutualIds.map((id) => new Types.ObjectId(id)) } })
      .select('username display_name avatar_url _id')
      .lean()
      .exec();

    return {
      total: users.length,
      friends: users.filter((u) => !u.username?.startsWith('__deleted__')),
    };
  }

  async getIncomingRequests(clerkId: string) {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.friendshipModel
      .find({ recipient_id: userObjId, status: 'pending' })
      .populate('requester_id', 'username display_name avatar_url theme _id')
      .exec();
  }

  async getOutgoingRequests(clerkId: string) {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.friendshipModel
      .find({ requester_id: userObjId, status: 'pending' })
      .populate('recipient_id', 'username display_name avatar_url theme _id')
      .exec();
  }

  async sendRequest(requesterClerkId: string, recipientId: string): Promise<FriendshipDocument> {
    const requesterObjId = await this.resolveMongoId(requesterClerkId);
    const recipientObjId = new Types.ObjectId(recipientId);

    if (requesterObjId.toString() === recipientObjId.toString()) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const recipient = await this.userModel
      .findById(recipientObjId)
      .select('privacy')
      .lean()
      .exec();
    if (!recipient) throw new NotFoundException('User not found');
    if ((recipient as { privacy?: { friend_requests?: boolean } }).privacy?.friend_requests === false) {
      throw new ForbiddenException('This user is not accepting friend requests');
    }

    const existing = await this.friendshipModel
      .findOne({
        $or: [
          { requester_id: requesterObjId, recipient_id: recipientObjId },
          { requester_id: recipientObjId, recipient_id: requesterObjId },
        ],
      })
      .exec();

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('Already friends');
      if (existing.status === 'pending')  throw new ConflictException('Request already pending');
      if (existing.status === 'blocked')  throw new ForbiddenException('Cannot send request');
      // 'removed' — leftover row from an old unfriend. The unique index on
      // (requester, recipient) would reject a fresh insert, so clear it first.
      await this.friendshipModel.deleteOne({ _id: existing._id }).exec();
    }

    const friendship = new this.friendshipModel({
      requester_id: requesterObjId,
      recipient_id: recipientObjId,
      status: 'pending',
    });

    await friendship.save();

    const requester = await this.userModel.findById(requesterObjId).select('display_name username').lean().exec();
    this.notifSvc.create({
      userId:  recipientObjId,
      actorId: requesterObjId,
      type:    'friend_request',
      title:   `${requester?.display_name ?? requester?.username ?? 'Someone'} sent you a friend request`,
    }).catch(() => {});

    return friendship;
  }

  async acceptRequest(currentClerkId: string, requesterId: string): Promise<FriendshipDocument> {
    const currentObjId = await this.resolveMongoId(currentClerkId);
    const requesterObjId = new Types.ObjectId(requesterId);

    const friendship = await this.friendshipModel
      .findOne({
        requester_id: requesterObjId,
        recipient_id: currentObjId,
        status: 'pending',
      })
      .exec();

    if (!friendship) throw new NotFoundException('No pending friend request from this user');

    friendship.status = 'accepted';
    await friendship.save();

    this.activitySvc.record(
      currentObjId,
      'friend_added',
      requesterObjId,
      'User',
    ).catch(() => {});

    const acceptor = await this.userModel.findById(currentObjId).select('display_name username').lean().exec();
    this.notifSvc.create({
      userId:  requesterObjId,
      actorId: currentObjId,
      type:    'friend_accepted',
      title:   `${acceptor?.display_name ?? acceptor?.username ?? 'Someone'} accepted your friend request`,
    }).catch(() => {});

    return friendship;
  }

  async withdrawRequest(requesterClerkId: string, recipientId: string): Promise<void> {
    const requesterObjId = await this.resolveMongoId(requesterClerkId);
    const recipientObjId = new Types.ObjectId(recipientId);

    const result = await this.friendshipModel
      .findOneAndDelete({
        requester_id: requesterObjId,
        recipient_id: recipientObjId,
        status: 'pending',
      })
      .exec();

    if (!result) throw new NotFoundException('No pending request to withdraw');
  }

  async rejectRequest(currentClerkId: string, requesterId: string): Promise<void> {
    const currentObjId = await this.resolveMongoId(currentClerkId);
    const requesterObjId = new Types.ObjectId(requesterId);

    const result = await this.friendshipModel
      .findOneAndDelete({
        requester_id: requesterObjId,
        recipient_id: currentObjId,
        status: 'pending',
      })
      .exec();

    if (!result) throw new NotFoundException('No pending friend request from this user');
  }

  async removeFriend(currentClerkId: string, friendId: string): Promise<void> {
    const currentObjId = await this.resolveMongoId(currentClerkId);
    const friendObjId = new Types.ObjectId(friendId);

    const result = await this.friendshipModel
      .findOneAndUpdate(
        {
          $or: [
            { requester_id: currentObjId, recipient_id: friendObjId },
            { requester_id: friendObjId, recipient_id: currentObjId },
          ],
          status: 'accepted',
        },
        { $set: { status: 'removed' } },
      )
      .exec();

    if (!result) throw new NotFoundException('Friendship not found');
  }

  async getArchived(clerkId: string) {
    const userObjId = await this.resolveMongoId(clerkId);

    const friendships = await this.friendshipModel
      .find({
        $or: [{ requester_id: userObjId }, { recipient_id: userObjId }],
        status: 'removed',
      })
      .populate('requester_id', 'username display_name avatar_url theme _id')
      .populate('recipient_id', 'username display_name avatar_url theme _id')
      .exec();

    return friendships.flatMap((f) => {
      const requester = f.requester_id as unknown as UserDocument | null;
      const recipient = f.recipient_id as unknown as UserDocument | null;
      // A user may have been deleted — populate then yields null. Skip it.
      if (!requester || !recipient) return [];
      const isRequester = requester._id.toString() === userObjId.toString();
      const friend = isRequester ? recipient : requester;
      if (friend.username?.startsWith('__deleted__')) return [];
      return [{ friendship_id: f._id, friend, since: f.created_at }];
    });
  }

  async blockUser(blockerClerkId: string, blockedId: string): Promise<FriendshipDocument> {
    const blockerObjId = await this.resolveMongoId(blockerClerkId);
    const blockedObjId = new Types.ObjectId(blockedId);

    if (blockerObjId.toString() === blockedObjId.toString()) {
      throw new BadRequestException('Cannot block yourself');
    }

    await this.friendshipModel
      .findOneAndDelete({
        $or: [
          { requester_id: blockerObjId, recipient_id: blockedObjId },
          { requester_id: blockedObjId, recipient_id: blockerObjId },
        ],
      })
      .exec();

    const blocked = new this.friendshipModel({
      requester_id: blockerObjId,
      recipient_id: blockedObjId,
      status: 'blocked',
    });

    return blocked.save();
  }
}
