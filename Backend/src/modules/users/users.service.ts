import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createClerkClient } from '@clerk/backend';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByClerkId(clerkId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ clerk_id: clerkId, deleted_at: null }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ username: username.toLowerCase(), deleted_at: null })
      .exec();
    if (!user) throw new NotFoundException(`User @${username} not found`);
    return user;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.userModel.findOne({ username: username.toLowerCase() }).exec();
    return !!user;
  }

  async createFromClerk(data: {
    clerk_id: string;
    username: string;
    display_name: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    country?: string;
    interests?: string[];
    hobbies?: string[];
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ clerk_id: data.clerk_id });
    if (existing) return existing;
    const taken = await this.isUsernameTaken(data.username);
    if (taken) throw new ConflictException('Username already taken');
    const user = new this.userModel({ ...data, username: data.username.toLowerCase() });
    return user.save();
  }

  async updateMe(clerkId: string, dto: UpdateUserDto): Promise<UserDocument> {
    if (dto.username) {
      const lower = dto.username.toLowerCase();
      const taken = await this.userModel.findOne({ username: lower, clerk_id: { $ne: clerkId } }).exec();
      if (taken) throw new ConflictException('Username already taken');
      dto = { ...dto, username: lower };
    }
    const user = await this.userModel
      .findOneAndUpdate({ clerk_id: clerkId }, { $set: dto }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async searchUsers(query: string, limit = 10): Promise<UserDocument[]> {
    if (!query || query.trim().length < 1) return [];
    const regex = new RegExp(query.trim(), 'i');
    return this.userModel
      .find({ $or: [{ username: regex }, { display_name: regex }], deleted_at: null })
      .select('username display_name avatar_url _id')
      .limit(limit)
      .exec();
  }

  async updateAvatar(clerkId: string, avatarUrl: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ clerk_id: clerkId }, { $set: { avatar_url: avatarUrl } }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async softDeleteMe(clerkId: string, reason?: string): Promise<void> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User not found');
    await this.userModel.findOneAndUpdate(
      { clerk_id: clerkId },
      { $set: { deleted_at: new Date(), deletion_reason: reason ?? '', username: `__deleted__${user.username}` } },
    ).exec();
    // Ban in Clerk so user cannot log back in (recoverable — unban + restore DB via support)
    await clerk.users.banUser(clerkId).catch(() => {});
  }
}
