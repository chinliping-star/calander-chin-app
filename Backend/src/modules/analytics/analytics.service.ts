import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProfileView, ProfileViewDocument } from './schemas/profile-view.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Friendship, FriendshipDocument } from '../friendships/schemas/friendship.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { effectivePremium } from '../../common/feature-flags';

type Period = 'daily' | 'weekly' | 'monthly';

function startOfPeriod(period: Period, isPremium: boolean): Date {
  const now = new Date();
  if (!isPremium) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'daily') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 84); // 12 weeks
    return d;
  }
  // monthly — 12 months
  const d = new Date(now);
  d.setMonth(d.getMonth() - 12);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(ProfileView.name) private readonly profileViewModel: Model<ProfileViewDocument>,
    @InjectModel(User.name)        private readonly userModel:        Model<UserDocument>,
    @InjectModel(Friendship.name)  private readonly friendshipModel:  Model<FriendshipDocument>,
    @InjectModel(Meetup.name)      private readonly meetupModel:      Model<MeetupDocument>,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Record profile view (called from UsersController)
  async recordView(profileId: Types.ObjectId, viewerId: Types.ObjectId | null): Promise<void> {
    if (viewerId && viewerId.toString() === profileId.toString()) return;

    // Debounce: same viewer once per 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const exists = await this.profileViewModel.findOne({
      profile_id: profileId,
      viewer_id: viewerId,
      viewed_at: { $gte: since },
    }).exec();
    if (exists) return;

    await new this.profileViewModel({ profile_id: profileId, viewer_id: viewerId }).save();
  }

  async getOverview(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    const userId = user._id as Types.ObjectId;

    const [totalViews, weekViews, friendCount, meetupCount] = await Promise.all([
      this.profileViewModel.countDocuments({ profile_id: userId }),
      this.profileViewModel.countDocuments({
        profile_id: userId,
        viewed_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      this.friendshipModel.countDocuments({
        status: 'accepted',
        $or: [{ requester_id: userId }, { recipient_id: userId }],
      }),
      this.meetupModel.countDocuments({
        status: 'accepted',
        $or: [{ proposer_id: userId }, { owner_id: userId }],
      }),
    ]);

    return {
      profileViews: { total: totalViews, week: weekViews },
      friends: friendCount,
      meetups: meetupCount,
      attendanceScore: (user as unknown as { attendance_score?: number }).attendance_score ?? 100,
      isPremium: effectivePremium(user.is_premium),
    };
  }

  async getProfileViews(clerkId: string, period: Period = 'weekly') {
    const user      = await this.resolveUser(clerkId);
    const userId    = user._id as Types.ObjectId;
    const since     = startOfPeriod(period, effectivePremium(user.is_premium));

    const records = await this.profileViewModel.find({
      profile_id: userId,
      viewed_at: { $gte: since },
    }).select('viewed_at').exec();

    return this.bucketByPeriod(records.map(r => r.viewed_at), period);
  }

  async getWhoViewed(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    if (!effectivePremium(user.is_premium)) return [];
    const userId = user._id as Types.ObjectId;

    return this.profileViewModel
      .find({ profile_id: userId, viewer_id: { $ne: null } })
      .populate('viewer_id', 'username display_name avatar_url')
      .sort({ viewed_at: -1 })
      .limit(50)
      .exec();
  }

  async getFriendRequestStats(clerkId: string, period: Period = 'weekly') {
    const user   = await this.resolveUser(clerkId);
    const userId = user._id as Types.ObjectId;
    const since  = startOfPeriod(period, effectivePremium(user.is_premium));

    const [sent, received] = await Promise.all([
      this.friendshipModel.find({ requester_id: userId, created_at: { $gte: since } }).select('created_at').exec(),
      this.friendshipModel.find({ recipient_id: userId, created_at: { $gte: since } }).select('created_at').exec(),
    ]);

    return {
      sent:     this.bucketByPeriod(sent.map(f => f.created_at), period),
      received: this.bucketByPeriod(received.map(f => f.created_at), period),
    };
  }

  async getMeetupRequestStats(clerkId: string, period: Period = 'weekly') {
    const user   = await this.resolveUser(clerkId);
    const userId = user._id as Types.ObjectId;
    const since  = startOfPeriod(period, effectivePremium(user.is_premium));

    const [sent, received] = await Promise.all([
      this.meetupModel.find({ proposer_id: userId, created_at: { $gte: since } }).select('created_at').exec(),
      this.meetupModel.find({ owner_id: userId, created_at: { $gte: since } }).select('created_at').exec(),
    ]);

    return {
      sent:     this.bucketByPeriod(sent.map(m => m.created_at), period),
      received: this.bucketByPeriod(received.map(m => m.created_at), period),
    };
  }

  private bucketByPeriod(dates: Date[], period: Period): { label: string; count: number }[] {
    const map = new Map<string, number>();

    for (const d of dates) {
      let key: string;
      if (period === 'daily') {
        key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      } else if (period === 'weekly') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        key = monday.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 7); // YYYY-MM
      }
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count }));
  }
}
