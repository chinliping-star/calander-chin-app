import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePrivateChatDto, CreateGroupChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
    @InjectModel(Message.name)      private readonly msgModel: Model<MessageDocument>,
    @InjectModel(User.name)         private readonly userModel: Model<UserDocument>,
  ) {}

  // ── Internal helpers ──────────────────────────────────────────────────────

  async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  private populateConv(query: ReturnType<Model<ConversationDocument>['findOne']>) {
    return query
      .populate('participants', 'username display_name avatar_url _id')
      .populate('owner_id', 'username display_name avatar_url _id')
      .populate('last_message.sender_id', 'username display_name avatar_url');
  }

  // ── Conversations ─────────────────────────────────────────────────────────

  async getConversations(clerkId: string): Promise<ConversationDocument[]> {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.convModel
      .find({ participants: userObjId })
      .populate('participants', 'username display_name avatar_url _id')
      .populate('last_message.sender_id', 'username display_name')
      .sort({ 'last_message.sent_at': -1, created_at: -1 })
      .exec();
  }

  async createPrivateChat(clerkId: string, dto: CreatePrivateChatDto): Promise<ConversationDocument> {
    const meObjId   = await this.resolveMongoId(clerkId);
    const themObjId = new Types.ObjectId(dto.recipientId);

    if (meObjId.toString() === themObjId.toString()) {
      throw new BadRequestException('Cannot chat with yourself');
    }

    // Return existing if already exists
    const existing = await this.convModel.findOne({
      type: 'private',
      participants: { $all: [meObjId, themObjId], $size: 2 },
    }).exec();

    if (existing) {
      return this.populateConv(this.convModel.findById(existing._id)).exec() as Promise<ConversationDocument>;
    }

    const conv = new this.convModel({
      type: 'private',
      participants: [meObjId, themObjId],
    });
    await conv.save();
    return this.populateConv(this.convModel.findById(conv._id)).exec() as Promise<ConversationDocument>;
  }

  async createGroupChat(clerkId: string, dto: CreateGroupChatDto): Promise<ConversationDocument> {
    const meObjId = await this.resolveMongoId(clerkId);
    const others  = dto.participantIds.map(id => new Types.ObjectId(id));
    const all     = [meObjId, ...others.filter(id => id.toString() !== meObjId.toString())];

    const conv = new this.convModel({
      type: 'group',
      name: dto.name,
      avatar_url: dto.avatar_url,
      owner_id: meObjId,
      participants: all,
    });
    await conv.save();
    return this.populateConv(this.convModel.findById(conv._id)).exec() as Promise<ConversationDocument>;
  }

  async addMember(clerkId: string, convId: string, userId: string): Promise<ConversationDocument> {
    const conv = await this.convModel.findById(convId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type !== 'group') throw new BadRequestException('Only group chats support adding members');

    const meObjId = await this.resolveMongoId(clerkId);
    if (conv.owner_id?.toString() !== meObjId.toString()) {
      throw new ForbiddenException('Only group owner can add members');
    }

    const newMember = new Types.ObjectId(userId);
    if (conv.participants.some(p => p.toString() === newMember.toString())) {
      throw new BadRequestException('User already in group');
    }

    conv.participants.push(newMember);
    await conv.save();
    return this.populateConv(this.convModel.findById(conv._id)).exec() as Promise<ConversationDocument>;
  }

  async removeMember(clerkId: string, convId: string, userId: string): Promise<ConversationDocument> {
    const conv = await this.convModel.findById(convId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type !== 'group') throw new BadRequestException('Only group chats support removing members');

    const meObjId = await this.resolveMongoId(clerkId);
    if (conv.owner_id?.toString() !== meObjId.toString()) {
      throw new ForbiddenException('Only group owner can remove members');
    }

    conv.participants = conv.participants.filter(p => p.toString() !== userId);
    await conv.save();
    return this.populateConv(this.convModel.findById(conv._id)).exec() as Promise<ConversationDocument>;
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async getMessages(
    clerkId: string,
    convId: string,
    before?: string,
    limit = 50,
  ): Promise<MessageDocument[]> {
    const userObjId = await this.resolveMongoId(clerkId);
    const conv = await this.convModel.findById(convId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some(p => p.toString() === userObjId.toString())) {
      throw new ForbiddenException('Not a participant');
    }

    const filter: Record<string, unknown> = { conversation_id: new Types.ObjectId(convId) };
    if (before) filter['_id'] = { $lt: new Types.ObjectId(before) };

    return this.msgModel
      .find(filter)
      .populate('sender_id', 'username display_name avatar_url _id')
      .sort({ created_at: -1 })
      .limit(limit)
      .exec()
      .then(msgs => msgs.reverse());
  }

  async sendMessage(
    clerkId: string,
    convId: string,
    content: string,
  ): Promise<MessageDocument> {
    const userObjId = await this.resolveMongoId(clerkId);
    const conv = await this.convModel.findById(convId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some(p => p.toString() === userObjId.toString())) {
      throw new ForbiddenException('Not a participant');
    }

    const msg = new this.msgModel({
      conversation_id: new Types.ObjectId(convId),
      sender_id: userObjId,
      content: content.trim(),
      seen_by: [userObjId],
    });
    await msg.save();

    // Update last_message on conversation
    conv.last_message = { content: content.trim(), sender_id: userObjId, sent_at: new Date() };
    await conv.save();

    return this.msgModel
      .findById(msg._id)
      .populate('sender_id', 'username display_name avatar_url _id')
      .exec() as Promise<MessageDocument>;
  }

  async editMessage(clerkId: string, messageId: string, content: string): Promise<MessageDocument> {
    const userObjId = await this.resolveMongoId(clerkId);
    const msg = await this.msgModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Cannot edit others messages');
    }

    msg.content = content.trim();
    msg.edited = true;
    await msg.save();

    return this.msgModel
      .findById(msg._id)
      .populate('sender_id', 'username display_name avatar_url _id')
      .exec() as Promise<MessageDocument>;
  }

  async deleteMessage(clerkId: string, messageId: string): Promise<void> {
    const userObjId = await this.resolveMongoId(clerkId);
    const msg = await this.msgModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Cannot delete others messages');
    }
    await this.msgModel.findByIdAndDelete(messageId).exec();
  }

  async markSeen(clerkId: string, convId: string, messageId: string): Promise<void> {
    const userObjId = await this.resolveMongoId(clerkId);
    await this.msgModel.updateOne(
      { _id: new Types.ObjectId(messageId), conversation_id: new Types.ObjectId(convId) },
      { $addToSet: { seen_by: userObjId } },
    ).exec();
  }

  async getUnreadCount(clerkId: string): Promise<number> {
    const userObjId = await this.resolveMongoId(clerkId);
    const convs = await this.convModel.find({ participants: userObjId }).select('_id').exec();
    const convIds = convs.map(c => c._id);
    return this.msgModel.countDocuments({
      conversation_id: { $in: convIds },
      sender_id: { $ne: userObjId },
      seen_by: { $ne: userObjId },
    }).exec();
  }
}
