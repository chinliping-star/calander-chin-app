import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notifModel: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').lean().exec();
    if (!user) throw new Error('User not found');
    return user._id as Types.ObjectId;
  }

  /** Like resolveMongoId but returns null instead of throwing — for read paths
   * that should degrade gracefully when the Clerk user has no DB profile yet. */
  private async resolveMongoIdOrNull(clerkId: string): Promise<Types.ObjectId | null> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').lean().exec();
    return user ? (user._id as Types.ObjectId) : null;
  }

  async create(payload: {
    userId: Types.ObjectId;
    actorId?: Types.ObjectId;
    type: NotificationType;
    title: string;
    body?: string;
    refId?: Types.ObjectId;
    refModel?: string;
  }): Promise<NotificationDocument> {
    return this.notifModel.create({
      user_id:   payload.userId,
      actor_id:  payload.actorId,
      type:      payload.type,
      title:     payload.title,
      body:      payload.body ?? '',
      ref_id:    payload.refId,
      ref_model: payload.refModel ?? '',
    });
  }

  /**
   * Batched notification: keep a single live notification per (user, type, ref).
   * Re-firing updates its title/body and marks it unread again instead of
   * spawning a new row — used for vote pings so 10 votes = 1 notification.
   */
  async upsert(payload: {
    userId: Types.ObjectId;
    actorId?: Types.ObjectId;
    type: NotificationType;
    title: string;
    body?: string;
    refId: Types.ObjectId;
    refModel?: string;
  }): Promise<void> {
    await this.notifModel.findOneAndUpdate(
      { user_id: payload.userId, type: payload.type, ref_id: payload.refId },
      {
        $set: {
          actor_id:   payload.actorId,
          title:      payload.title,
          body:       payload.body ?? '',
          ref_model:  payload.refModel ?? '',
          is_read:    false,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true },
    ).exec();
  }

  async getForUser(clerkId: string): Promise<NotificationDocument[]> {
    const userId = await this.resolveMongoIdOrNull(clerkId);
    if (!userId) return [];
    return this.notifModel
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('actor_id', 'display_name username avatar_url')
      .lean()
      .exec() as unknown as NotificationDocument[];
  }

  async getUnreadCount(clerkId: string): Promise<number> {
    const userId = await this.resolveMongoIdOrNull(clerkId);
    if (!userId) return 0;
    return this.notifModel.countDocuments({ user_id: userId, is_read: false }).exec();
  }

  async markRead(clerkId: string, notifId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    await this.notifModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notifId), user_id: userId },
      { $set: { is_read: true } },
    ).exec();
  }

  async markAllRead(clerkId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    await this.notifModel.updateMany({ user_id: userId, is_read: false }, { $set: { is_read: true } }).exec();
  }
}
