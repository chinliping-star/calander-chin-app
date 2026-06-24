import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CreateReportDto, ResolveReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    @InjectModel(User.name)   private readonly userModel:   Model<UserDocument>,
    @InjectModel(Post.name)   private readonly postModel:   Model<PostDocument>,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  // ── User-facing ─────────────────────────────────────────────────────────────

  async create(clerkId: string, dto: CreateReportDto): Promise<ReportDocument> {
    const reporterId = await this.resolveMongoId(clerkId);
    const targetId = new Types.ObjectId(dto.target_id);
    const target_model = dto.target_type === 'user' ? 'User' : 'Post';

    if (dto.target_type === 'user' && targetId.equals(reporterId)) {
      throw new BadRequestException('You cannot report yourself');
    }

    // Avoid duplicate open reports from the same user on the same target.
    const existing = await this.reportModel.findOne({
      reporter_id: reporterId,
      target_id: targetId,
      status: { $in: ['pending', 'reviewing'] },
    }).exec();
    if (existing) return existing;

    return new this.reportModel({
      reporter_id: reporterId,
      target_type: dto.target_type,
      target_id: targetId,
      target_model,
      reason: dto.reason,
      details: dto.details ?? '',
    }).save();
  }

  /** System-generated report from the content scanner (no human reporter). */
  async createAuto(
    targetType: 'user' | 'post',
    targetId: Types.ObjectId,
    reason: string,
    detail: string,
  ): Promise<void> {
    const existing = await this.reportModel.findOne({
      target_id: targetId,
      auto: true,
      status: { $in: ['pending', 'reviewing'] },
    }).exec();
    if (existing) return;

    await new this.reportModel({
      reporter_id: null,
      auto: true,
      target_type: targetType,
      target_id: targetId,
      target_model: targetType === 'user' ? 'User' : 'Post',
      reason,
      details: `[auto] ${detail}`,
    }).save();
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async adminList({ page = 1, limit = 20, status = '', type = '' }: {
    page?: number; limit?: number; status?: string; type?: string;
  }) {
    const filter: FilterQuery<ReportDocument> = {};
    if (status && ['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) filter.status = status;
    if (type && ['user', 'post'].includes(type)) filter.target_type = type;

    const [items, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .populate('reporter_id', 'username display_name avatar_url')
        .populate('target_id')
        .populate('resolved_by', 'username display_name')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.reportModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async resolve(id: string, clerkId: string, dto: ResolveReportDto): Promise<ReportDocument> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) throw new NotFoundException('Report not found');

    const adminId = await this.resolveMongoId(clerkId);
    const action = dto.action ?? 'none';

    // Apply the chosen moderation action to the target.
    if (action === 'remove_content' && report.target_type === 'post') {
      await this.postModel.findByIdAndDelete(report.target_id).exec();
    } else if (action === 'suspend_user' || action === 'block_user') {
      const targetUserId =
        report.target_type === 'user'
          ? report.target_id
          : (await this.postModel.findById(report.target_id).select('author_id').lean().exec())?.author_id;
      if (targetUserId) {
        await this.userModel.findByIdAndUpdate(targetUserId, {
          $set: { status: action === 'suspend_user' ? 'suspended' : 'blocked' },
        }).exec();
      }
    }

    report.status = dto.status;
    report.action_taken = action;
    report.resolved_by = adminId;
    report.resolved_at = new Date();
    await report.save();

    return report;
  }

  /** Pending-report counts for the dashboard KPI cards. */
  async pendingCounts(): Promise<{ reportedPosts: number; reportedUsers: number }> {
    const open = { status: { $in: ['pending', 'reviewing'] } } as FilterQuery<ReportDocument>;
    const [reportedPosts, reportedUsers] = await Promise.all([
      this.reportModel.countDocuments({ ...open, target_type: 'post' }),
      this.reportModel.countDocuments({ ...open, target_type: 'user' }),
    ]);
    return { reportedPosts, reportedUsers };
  }

  /** Flat rows for CSV/Excel export. */
  async exportRows(): Promise<Record<string, unknown>[]> {
    const rows = await this.reportModel
      .find({})
      .populate('reporter_id', 'username email')
      .sort({ created_at: -1 })
      .lean()
      .exec();
    return rows.map(r => ({
      id: String(r._id),
      target_type: r.target_type,
      target_id: String(r.target_id),
      reason: r.reason,
      details: r.details,
      status: r.status,
      action_taken: r.action_taken,
      reporter: (r.reporter_id as unknown as { username?: string })?.username ?? '',
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  }
}
