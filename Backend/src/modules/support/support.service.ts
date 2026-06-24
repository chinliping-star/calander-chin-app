import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SupportTicket, SupportTicketDocument,
  SupportChat, SupportChatDocument,
} from './schemas/support.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private readonly ticketModel: Model<SupportTicketDocument>,
    @InjectModel(SupportChat.name)   private readonly chatModel:   Model<SupportChatDocument>,
    @InjectModel(User.name)          private readonly userModel:   Model<UserDocument>,
  ) {}

  private async resolveMongoId(clerkId?: string): Promise<Types.ObjectId | null> {
    if (!clerkId) return null;
    const u = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').lean().exec();
    return (u?._id as Types.ObjectId) ?? null;
  }

  async createTicket(
    clerkId: string | undefined,
    dto: { name: string; email: string; subject: string; message: string },
  ): Promise<SupportTicketDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const ticket = await this.ticketModel.create({ user_id: userId, ...dto });
    // NOTE: real email delivery needs SMTP creds. For now the ticket is stored
    // in the DB so the owner can read it. Hook nodemailer here when configured.
    return ticket;
  }

  async saveChat(
    clerkId: string | undefined,
    dto: { sessionId: string; from: 'user' | 'bot' | 'agent'; text: string; needsAgent?: boolean },
  ): Promise<SupportChatDocument> {
    const userId = await this.resolveMongoId(clerkId);
    return this.chatModel.create({
      user_id: userId,
      session_id: dto.sessionId,
      from: dto.from,
      text: dto.text,
      needs_agent: dto.needsAgent ?? false,
    });
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async adminListTickets({ page = 1, limit = 20, status = '' }: { page?: number; limit?: number; status?: string }) {
    const filter: Record<string, unknown> = {};
    if (status === 'open' || status === 'resolved') filter.status = status;
    const [items, total] = await Promise.all([
      this.ticketModel.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.ticketModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async resolveTicket(id: string): Promise<{ ok: boolean }> {
    await this.ticketModel.findByIdAndUpdate(id, { $set: { status: 'resolved' } }).exec();
    return { ok: true };
  }
}
