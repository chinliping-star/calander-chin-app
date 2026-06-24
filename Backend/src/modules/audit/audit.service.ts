import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
    @InjectModel(User.name)     private readonly userModel:  Model<UserDocument>,
  ) {}

  async record(entry: { clerkId: string; method: string; path: string; status: number }): Promise<void> {
    const user = await this.userModel
      .findOne({ clerk_id: entry.clerkId })
      .select('username')
      .lean()
      .exec();
    await this.auditModel.create({
      actor_clerk_id: entry.clerkId,
      actor_username: user?.username ?? '',
      method: entry.method,
      path: entry.path,
      status: entry.status,
    });
  }

  async list({ page = 1, limit = 30 }: { page?: number; limit?: number }) {
    const [items, total] = await Promise.all([
      this.auditModel.find({}).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.auditModel.countDocuments({}),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
