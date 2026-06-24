import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { Community, CommunityDocument } from '../communities/schemas/community.schema';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ReportsService } from '../reports/reports.service';
import { ResolveReportDto } from '../reports/dto/create-report.dto';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)      private readonly userModel:      Model<UserDocument>,
    @InjectModel(Post.name)      private readonly postModel:      Model<PostDocument>,
    @InjectModel(Meetup.name)    private readonly meetupModel:    Model<MeetupDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
    private readonly reportsService: ReportsService,
  ) {}

  // ── Dashboard ───────────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const notDeleted: FilterQuery<UserDocument> = { deleted_at: null };

    const [
      totalUsers, premiumUsers, suspendedUsers, blockedUsers,
      newToday, newThisWeek, newThisMonth,
      totalPosts, totalMeetups, totalCommunities,
    ] = await Promise.all([
      this.userModel.countDocuments(notDeleted),
      this.userModel.countDocuments({ ...notDeleted, is_premium: true }),
      this.userModel.countDocuments({ status: 'suspended' }),
      this.userModel.countDocuments({ status: 'blocked' }),
      this.userModel.countDocuments({ created_at: { $gte: startOfDay } }),
      this.userModel.countDocuments({ created_at: { $gte: startOfWeek } }),
      this.userModel.countDocuments({ created_at: { $gte: startOfMonth } }),
      this.postModel.countDocuments({}),
      this.meetupModel.countDocuments({}),
      this.communityModel.countDocuments({}),
    ]);

    const userGrowth = await this.dailyCounts(this.userModel, 'created_at', 14);
    const postVolume = await this.dailyCounts(this.postModel, 'created_at', 14);
    const { reportedPosts, reportedUsers } = await this.reportsService.pendingCounts();

    return {
      kpis: {
        totalUsers,
        premiumUsers,
        suspendedUsers,
        blockedUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        totalPosts,
        totalMeetups,
        totalCommunities,
        reportedPosts,
        reportedUsers,
      },
      charts: { userGrowth, postVolume },
    };
  }

  /** Per-day document counts for the last `days` days, as [{ date, count }]. */
  private async dailyCounts(
    model: Model<any>,
    dateField: string,
    days: number,
  ): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await model.aggregate([
      { $match: { [dateField]: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const map = new Map<string, number>(rows.map(r => [r._id as string, r.count as number]));
    const out: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: map.get(key) ?? 0 });
    }
    return out;
  }

  // ── User management ───────────────────────────────────────────────────────────

  async listUsers({ page = 1, limit = 20, search = '', status = '' }: ListParams) {
    const filter: FilterQuery<UserDocument> = {};
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ username: rx }, { display_name: rx }, { email: rx }];
    }
    if (status && ['active', 'suspended', 'blocked'].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('username display_name email avatar_url status role is_premium is_admin created_at deleted_at suspended_until moderation_reason')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUserDetail(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-__v')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');

    const uid = new Types.ObjectId(id);
    const [posts, meetups, communities] = await Promise.all([
      this.postModel.countDocuments({ author_id: uid }),
      this.meetupModel.countDocuments({ $or: [{ proposer_id: uid }, { owner_id: uid }, { participants: uid }] }),
      this.communityModel.countDocuments({ owner_id: uid }),
    ]);

    return { user, activity: { posts, meetups, communitiesOwned: communities } };
  }

  async moderateUser(id: string, dto: ModerateUserDto) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if (dto.status !== undefined) user.status = dto.status;
    if (dto.moderation_reason !== undefined) user.moderation_reason = dto.moderation_reason;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.is_premium !== undefined) user.is_premium = dto.is_premium;
    if (dto.is_admin !== undefined) user.is_admin = dto.is_admin;
    if (dto.suspended_until !== undefined) {
      user.suspended_until = dto.suspended_until ? new Date(dto.suspended_until) : null;
    }
    // Clearing suspension when reactivating
    if (dto.status === 'active') user.suspended_until = null;

    await user.save();
    return this.getUserDetail(id);
  }

  /** Soft delete — 30-day recovery window handled by the deleted_at timestamp. */
  async softDeleteUser(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    user.deleted_at = new Date();
    user.status = 'blocked';
    await user.save();
    return { ok: true };
  }

  async restoreUser(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    user.deleted_at = null;
    user.status = 'active';
    await user.save();
    return { ok: true };
  }

  // ── Content moderation ────────────────────────────────────────────────────────

  async listPosts({ page = 1, limit = 20, search = '' }: ListParams) {
    const filter: FilterQuery<PostDocument> = {};
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }
    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate('author_id', 'username display_name avatar_url')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deletePost(id: string) {
    const res = await this.postModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Post not found');
    return { ok: true };
  }

  async listCommunities({ page = 1, limit = 20, search = '' }: ListParams) {
    const filter: FilterQuery<CommunityDocument> = {};
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: rx }, { slug: rx }];
    }
    const [items, total] = await Promise.all([
      this.communityModel
        .find(filter)
        .populate('owner_id', 'username display_name avatar_url')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.communityModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deleteCommunity(id: string) {
    const res = await this.communityModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Community not found');
    return { ok: true };
  }

  async listMeetups({ page = 1, limit = 20, search = '' }: ListParams) {
    const filter: FilterQuery<MeetupDocument> = {};
    if (search.trim()) filter.title = new RegExp(search.trim(), 'i');
    const [items, total] = await Promise.all([
      this.meetupModel
        .find(filter)
        .populate('proposer_id', 'username display_name avatar_url')
        .populate('owner_id', 'username display_name avatar_url')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.meetupModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deleteMeetup(id: string) {
    const res = await this.meetupModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Meetup not found');
    return { ok: true };
  }

  // ── Data export ───────────────────────────────────────────────────────────────

  /** Serialize an array of flat objects to a CSV string (RFC-4180 quoting). */
  private toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) lines.push(headers.map(h => escape(row[h])).join(','));
    return lines.join('\n');
  }

  async exportUsersCsv(): Promise<string> {
    const users = await this.userModel
      .find({})
      .select('username display_name email status role is_premium is_admin created_at')
      .sort({ created_at: -1 })
      .lean()
      .exec();
    const rows = users.map(u => ({
      username: u.username,
      display_name: u.display_name ?? '',
      email: u.email ?? '',
      status: u.status ?? 'active',
      role: u.role ?? 'user',
      is_premium: u.is_premium ? 'yes' : 'no',
      is_admin: u.is_admin ? 'yes' : 'no',
      created_at: u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at),
    }));
    return this.toCsv(rows);
  }

  async exportReportsCsv(): Promise<string> {
    const rows = await this.reportsService.exportRows();
    return this.toCsv(rows);
  }

  // ── Reports (delegates to ReportsService) ──────────────────────────────────────

  listReports(params: { page?: number; status?: string; type?: string }) {
    return this.reportsService.adminList(params);
  }

  resolveReport(id: string, clerkId: string, dto: ResolveReportDto) {
    return this.reportsService.resolve(id, clerkId, dto);
  }
}
