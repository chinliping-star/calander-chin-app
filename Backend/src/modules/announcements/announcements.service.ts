import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name) private readonly model: Model<AnnouncementDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────────

  async create(clerkId: string, dto: CreateAnnouncementDto): Promise<AnnouncementDocument> {
    const admin = await this.resolveUser(clerkId);
    return new this.model({
      ...dto,
      publish_at: dto.publish_at ? new Date(dto.publish_at) : new Date(),
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      created_by: admin._id,
    }).save();
  }

  async adminList() {
    return this.model.find({}).sort({ is_pinned: -1, created_at: -1 }).lean().exec();
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<AnnouncementDocument> {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.publish_at !== undefined) patch.publish_at = dto.publish_at ? new Date(dto.publish_at) : new Date();
    if (dto.expires_at !== undefined) patch.expires_at = dto.expires_at ? new Date(dto.expires_at) : null;
    const doc = await this.model.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
    if (!doc) throw new NotFoundException('Announcement not found');
    return doc;
  }

  async remove(id: string): Promise<{ ok: boolean }> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Announcement not found');
    return { ok: true };
  }

  // ── User-facing ─────────────────────────────────────────────────────────────

  /** Active, audience-matched, not-yet-dismissed announcements for this user. */
  async activeFor(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    const uid = user._id as Types.ObjectId;
    const now = new Date();

    const audiences = ['all'];
    if (user.is_premium) audiences.push('premium');
    if (user.is_admin) audiences.push('admins');

    return this.model
      .find({
        publish_at: { $lte: now },
        audience: { $in: audiences },
        dismissed_by: { $ne: uid },
        $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
      })
      .sort({ is_pinned: -1, priority: -1, created_at: -1 })
      .lean()
      .exec();
  }

  async dismiss(clerkId: string, id: string): Promise<{ ok: boolean }> {
    const user = await this.resolveUser(clerkId);
    await this.model.findByIdAndUpdate(id, {
      $addToSet: { dismissed_by: user._id },
    }).exec();
    return { ok: true };
  }
}
