import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { Community, CommunityDocument } from '../communities/schemas/community.schema';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { ReportsService } from '../reports/reports.service';
import { ResolveReportDto } from '../reports/dto/create-report.dto';
import { CoinsService } from '../coins/coins.service';
import { isOwnerAdmin, ownerAdminEmails } from './admin-access';

/** A user row in the admin list, with effective admin access filled in. */
export type AdminUserRow = Record<string, unknown> & { email?: string; is_admin: boolean; is_owner_admin: boolean };

export interface Paged<T> { items: T[]; total: number; page: number; limit: number; pages: number }

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
    private readonly coinsService: CoinsService,
    private readonly config: ConfigService,
  ) {}

  private get adminEmailsRaw() {
    return this.config.get<string>('ADMIN_EMAILS');
  }

  /**
   * Guards against locking the panel out: an admin can't demote, block or
   * delete themselves, and owner admins (ADMIN_EMAILS) can't be touched here.
   */
  private assertSafeChange(
    actorClerkId: string,
    target: UserDocument,
    change: { removeAdmin?: boolean; restrict?: boolean },
  ) {
    if (!change.removeAdmin && !change.restrict) return;
    if (target.clerk_id === actorClerkId) {
      throw new BadRequestException(
        change.removeAdmin ? "You can't remove your own admin access." : "You can't block, suspend or delete your own account here.",
      );
    }
    if (isOwnerAdmin(target.email, this.adminEmailsRaw)) {
      throw new BadRequestException(
        'This is an owner admin (set in the server ADMIN_EMAILS config). Remove the email there to change it.',
      );
    }
  }

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
      totalPosts, totalMeetups, totalCommunities, trustedUsers,
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
      this.userModel.countDocuments({ ...notDeleted, is_trusted: true }),
    ]);

    const userGrowth = await this.dailyCounts(this.userModel, 'created_at', 14);
    const postVolume = await this.dailyCounts(this.postModel, 'created_at', 14);
    const { reportedPosts, reportedUsers } = await this.reportsService.pendingCounts();
    const [coins, topUsers] = await Promise.all([this.coinsService.stats(), this.coinsService.topEarners(30, 8)]);

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
        trustedUsers,
      },
      coins,
      topUsers,
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

  async listUsers({ page = 1, limit = 20, search = '', status = '' }: ListParams): Promise<Paged<AdminUserRow>> {
    const filter: FilterQuery<UserDocument> = {};
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ username: rx }, { display_name: rx }, { email: rx }];
    }
    if (status && ['active', 'suspended', 'blocked'].includes(status)) {
      filter.status = status;
    } else if (status === 'trusted') {
      filter.is_trusted = true;
    } else if (status === 'premium') {
      filter.is_premium = true;
    } else if (status === 'admins') {
      const owners = ownerAdminEmails(this.adminEmailsRaw);
      const admins = { $or: [{ is_admin: true }, { email: { $in: owners } }] };
      // Keep the search $or intact by nesting both under $and.
      if (filter.$or) { filter.$and = [{ $or: filter.$or }, admins]; delete filter.$or; }
      else Object.assign(filter, admins);
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('username display_name email avatar_url status role is_premium premium_source premium_until is_admin is_trusted coins created_at deleted_at suspended_until moderation_reason')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    const raw = this.adminEmailsRaw;
    const withAccess = items.map((u): AdminUserRow => {
      const owner = isOwnerAdmin(u.email, raw);
      return { ...u, is_admin: !!u.is_admin || owner, is_owner_admin: owner };
    });
    return { items: withAccess, total, page, limit, pages: Math.ceil(total / limit) };
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

  async moderateUser(actorClerkId: string, id: string, dto: ModerateUserDto) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    this.assertSafeChange(actorClerkId, user, {
      removeAdmin: dto.is_admin === false && (user.is_admin || isOwnerAdmin(user.email, this.adminEmailsRaw)),
      restrict: (dto.status === 'suspended' || dto.status === 'blocked') && dto.status !== user.status,
    });

    if (dto.status !== undefined) user.status = dto.status;
    if (dto.moderation_reason !== undefined) user.moderation_reason = dto.moderation_reason;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.is_premium !== undefined && dto.is_premium !== user.is_premium) {
      user.is_premium = dto.is_premium;
      user.premium_source = dto.is_premium ? 'admin' : null;
      user.premium_until = null;
    }
    if (dto.is_trusted !== undefined) user.is_trusted = dto.is_trusted;
    if (dto.is_admin !== undefined) user.is_admin = dto.is_admin;
    if (dto.suspended_until !== undefined) {
      user.suspended_until = dto.suspended_until ? new Date(dto.suspended_until) : null;
    }
    // Clearing suspension when reactivating
    if (dto.status === 'active') user.suspended_until = null;

    await user.save();
    return this.getUserDetail(id);
  }

  adjustCoins(id: string, amount: number, note: string) {
    return this.coinsService.adminAdjust(id, amount, note);
  }

  topUsers(days: number) {
    return this.coinsService.topEarners(days, 25);
  }

  /** Soft delete — 30-day recovery window handled by the deleted_at timestamp. */
  async softDeleteUser(actorClerkId: string, id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    this.assertSafeChange(actorClerkId, user, { restrict: true });
    user.deleted_at = new Date();
    user.status = 'blocked';
    await user.save();
    return { ok: true };
  }

  // ── Admins ──────────────────────────────────────────────────────────────────

  /** Everyone with panel access: owner admins (ADMIN_EMAILS) + is_admin users. */
  async listAdmins(): Promise<AdminUserRow[]> {
    const owners = ownerAdminEmails(this.adminEmailsRaw);
    const users = await this.userModel
      .find({ deleted_at: null, $or: [{ is_admin: true }, { email: { $in: owners } }] })
      .select('username display_name email avatar_url is_admin created_at')
      .sort({ created_at: 1 })
      .lean()
      .exec();
    return users.map((u): AdminUserRow => {
      const owner = isOwnerAdmin(u.email, this.adminEmailsRaw);
      return { ...u, is_admin: true, is_owner_admin: owner };
    });
  }

  /** Give admin access to the account registered with this email. */
  async addAdminByEmail(email: string) {
    const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await this.userModel
      .findOne({ email: new RegExp(`^${escaped}$`, 'i'), deleted_at: null })
      .exec();
    if (!user) throw new NotFoundException('No Friendiary account uses this email. They need to sign up first.');
    if (user.is_admin || isOwnerAdmin(user.email, this.adminEmailsRaw)) {
      throw new BadRequestException(`@${user.username} is already an admin.`);
    }
    user.is_admin = true;
    await user.save();
    return { ok: true, username: user.username };
  }

  async removeAdmin(actorClerkId: string, id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    this.assertSafeChange(actorClerkId, user, { removeAdmin: true });
    user.is_admin = false;
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
