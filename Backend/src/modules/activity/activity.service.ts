import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument, ActivityType } from './schemas/activity.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Friendship, FriendshipDocument } from '../friendships/schemas/friendship.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name)   private readonly activityModel:    Model<ActivityDocument>,
    @InjectModel(User.name)       private readonly userModel:        Model<UserDocument>,
    @InjectModel(Friendship.name) private readonly friendshipModel:  Model<FriendshipDocument>,
  ) {}

  async record(
    actorId: Types.ObjectId,
    type: ActivityType,
    refId: Types.ObjectId,
    refModel: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await new this.activityModel({ actor_id: actorId, type, ref_id: refId, ref_model: refModel, meta }).save();
  }

  /** Reshape a populated doc so the client receives `actor` (not `actor_id`). */
  private serialize(doc: Record<string, unknown>) {
    const { actor_id, ...rest } = doc;
    return { ...rest, actor: actor_id };
  }

  async getFeed(clerkId: string, page = 1, limit = 30) {
    const user   = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User not found');
    const userId = user._id as Types.ObjectId;

    const friendships = await this.friendshipModel.find({
      status: 'accepted',
      $or: [{ requester_id: userId }, { recipient_id: userId }],
    }).select('requester_id recipient_id').exec();

    const friendIds = friendships.map(f =>
      f.requester_id.toString() === userId.toString() ? f.recipient_id : f.requester_id,
    );

    const docs = await this.activityModel
      .find({ actor_id: { $in: [...friendIds, userId] } })
      .populate('actor_id', 'username display_name avatar_url')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    // Drop activities whose actor was deleted (populate yields null).
    return docs.filter(d => d.actor_id).map(d => this.serialize(d));
  }

  async getUserActivity(username: string, page = 1, limit = 20) {
    const user = await this.userModel.findOne({ username }).select('_id').exec();
    if (!user) throw new NotFoundException('User not found');

    const docs = await this.activityModel
      .find({ actor_id: user._id })
      .populate('actor_id', 'username display_name avatar_url')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    return docs.filter(d => d.actor_id).map(d => this.serialize(d));
  }
}
