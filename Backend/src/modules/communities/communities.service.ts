import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from './schemas/community.schema';
import { CommunityMember, CommunityMemberDocument } from './schemas/community-member.schema';
import { CommunityPost, CommunityPostDocument } from './schemas/community-post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CreateCommunityDto,
  UpdateCommunityDto,
  CreatePostDto,
  UpdateRoleDto,
} from './dto/communities.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name)       private readonly communityModel:  Model<CommunityDocument>,
    @InjectModel(CommunityMember.name) private readonly memberModel:      Model<CommunityMemberDocument>,
    @InjectModel(CommunityPost.name)   private readonly postModel:        Model<CommunityPostDocument>,
    @InjectModel(User.name)            private readonly userModel:        Model<UserDocument>,
    private readonly activitySvc: ActivityService,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  private async getMemberRole(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<string | null> {
    const m = await this.memberModel.findOne({ community_id: communityId, user_id: userId }).exec();
    return m?.role ?? null;
  }

  // ── Browse / search ───────────────────────────────────────────────────────

  async browse(page = 1, limit = 20): Promise<CommunityDocument[]> {
    return this.communityModel
      .find({ is_private: false })
      .populate('owner_id', 'username display_name avatar_url')
      .sort({ member_count: -1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async search(q: string): Promise<CommunityDocument[]> {
    const regex = new RegExp(q.trim(), 'i');
    return this.communityModel
      .find({
        is_private: false,
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
      .populate('owner_id', 'username display_name avatar_url')
      .limit(20)
      .exec();
  }

  async getBySlug(slug: string, clerkId?: string): Promise<CommunityDocument & { userRole?: string | null }> {
    const community = await this.communityModel
      .findOne({ slug })
      .populate('owner_id', 'username display_name avatar_url')
      .exec();
    if (!community) throw new NotFoundException('Community not found');

    let userRole: string | null = null;
    if (clerkId) {
      const userId = await this.resolveMongoId(clerkId);
      userRole = await this.getMemberRole(community._id as Types.ObjectId, userId);
    }

    return Object.assign(community.toObject(), { userRole }) as CommunityDocument & { userRole: string | null };
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(clerkId: string, dto: CreateCommunityDto): Promise<CommunityDocument> {
    const userId = await this.resolveMongoId(clerkId);

    const existing = await this.communityModel.findOne({ slug: dto.slug }).exec();
    if (existing) throw new ConflictException('Slug already taken');

    const community = new this.communityModel({
      ...dto,
      owner_id: userId,
      member_count: 1,
    });
    await community.save();

    await new this.memberModel({
      community_id: community._id,
      user_id: userId,
      role: 'owner',
    }).save();

    this.activitySvc.record(
      userId,
      'community_created',
      community._id as Types.ObjectId,
      'Community',
      { name: community.name, slug: community.slug },
    ).catch(() => {});

    return this.communityModel
      .findById(community._id)
      .populate('owner_id', 'username display_name avatar_url')
      .exec() as Promise<CommunityDocument>;
  }

  async update(clerkId: string, communityId: string, dto: UpdateCommunityDto): Promise<CommunityDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (community.owner_id.toString() !== userId.toString()) throw new ForbiddenException('Owner only');

    Object.assign(community, dto);
    await community.save();
    return this.communityModel
      .findById(community._id)
      .populate('owner_id', 'username display_name avatar_url')
      .exec() as Promise<CommunityDocument>;
  }

  async delete(clerkId: string, communityId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (community.owner_id.toString() !== userId.toString()) throw new ForbiddenException('Owner only');

    await Promise.all([
      this.communityModel.findByIdAndDelete(communityId),
      this.memberModel.deleteMany({ community_id: new Types.ObjectId(communityId) }),
      this.postModel.deleteMany({ community_id: new Types.ObjectId(communityId) }),
    ]);
  }

  // ── Membership ────────────────────────────────────────────────────────────

  async join(clerkId: string, communityId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (community.is_private) throw new ForbiddenException('Private community — invite required');

    const exists = await this.memberModel.findOne({
      community_id: new Types.ObjectId(communityId),
      user_id: userId,
    }).exec();
    if (exists) throw new ConflictException('Already a member');

    await new this.memberModel({
      community_id: new Types.ObjectId(communityId),
      user_id: userId,
      role: 'member',
    }).save();

    await this.communityModel.findByIdAndUpdate(communityId, { $inc: { member_count: 1 } }).exec();

    this.activitySvc.record(
      userId,
      'community_joined',
      community._id as Types.ObjectId,
      'Community',
      { name: community.name, slug: community.slug },
    ).catch(() => {});
  }

  async leave(clerkId: string, communityId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (community.owner_id.toString() === userId.toString()) {
      throw new BadRequestException('Owner cannot leave — transfer ownership or delete community');
    }

    const result = await this.memberModel.findOneAndDelete({
      community_id: new Types.ObjectId(communityId),
      user_id: userId,
    }).exec();
    if (!result) throw new NotFoundException('Not a member');

    await this.communityModel.findByIdAndUpdate(communityId, { $inc: { member_count: -1 } }).exec();
  }

  async getMembers(communityId: string): Promise<CommunityMemberDocument[]> {
    return this.memberModel
      .find({ community_id: new Types.ObjectId(communityId) })
      .populate('user_id', 'username display_name avatar_url _id')
      .sort({ role: 1, joined_at: 1 })
      .exec();
  }

  async updateRole(clerkId: string, communityId: string, targetUserId: string, dto: UpdateRoleDto): Promise<void> {
    const actorId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (community.owner_id.toString() !== actorId.toString()) throw new ForbiddenException('Owner only');

    const result = await this.memberModel.findOneAndUpdate(
      { community_id: new Types.ObjectId(communityId), user_id: new Types.ObjectId(targetUserId) },
      { $set: { role: dto.role } },
    ).exec();
    if (!result) throw new NotFoundException('Member not found');
  }

  async removeMember(clerkId: string, communityId: string, targetUserId: string): Promise<void> {
    const actorId = await this.resolveMongoId(clerkId);
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');

    const actorRole = await this.getMemberRole(community._id as Types.ObjectId, actorId);
    if (!actorRole || !['owner', 'moderator'].includes(actorRole)) throw new ForbiddenException('Moderator or owner only');

    if (community.owner_id.toString() === targetUserId) throw new ForbiddenException('Cannot remove owner');

    const result = await this.memberModel.findOneAndDelete({
      community_id: new Types.ObjectId(communityId),
      user_id: new Types.ObjectId(targetUserId),
    }).exec();
    if (!result) throw new NotFoundException('Member not found');

    await this.communityModel.findByIdAndUpdate(communityId, { $inc: { member_count: -1 } }).exec();
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  async getPosts(communityId: string, page = 1, limit = 20): Promise<CommunityPostDocument[]> {
    return this.postModel
      .find({ community_id: new Types.ObjectId(communityId) })
      .populate('author_id', 'username display_name avatar_url _id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async createPost(clerkId: string, communityId: string, dto: CreatePostDto): Promise<CommunityPostDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const role = await this.getMemberRole(new Types.ObjectId(communityId), userId);
    if (!role) throw new ForbiddenException('Members only');

    // Only owner/mod can post announcements
    if (dto.type === 'announcement' && !['owner', 'moderator'].includes(role)) {
      throw new ForbiddenException('Only owner/moderator can post announcements');
    }

    const post = new this.postModel({
      community_id: new Types.ObjectId(communityId),
      author_id: userId,
      type: dto.type ?? 'post',
      content: dto.content,
      title: dto.title,
      image_url: dto.image_url,
      event_date: dto.event_date ? new Date(dto.event_date) : undefined,
      event_location: dto.event_location,
    });
    await post.save();

    return this.postModel
      .findById(post._id)
      .populate('author_id', 'username display_name avatar_url _id')
      .exec() as Promise<CommunityPostDocument>;
  }

  async deletePost(clerkId: string, communityId: string, postId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.community_id.toString() !== communityId) throw new BadRequestException('Post not in this community');

    const role = await this.getMemberRole(new Types.ObjectId(communityId), userId);
    const isAuthor = post.author_id.toString() === userId.toString();
    const isMod = role && ['owner', 'moderator'].includes(role);

    if (!isAuthor && !isMod) throw new ForbiddenException('Cannot delete this post');

    await this.postModel.findByIdAndDelete(postId).exec();
  }

  async getMyCommunities(clerkId: string): Promise<CommunityDocument[]> {
    const userId = await this.resolveMongoId(clerkId);
    const memberships = await this.memberModel.find({ user_id: userId }).select('community_id').exec();
    const ids = memberships.map(m => m.community_id);
    return this.communityModel
      .find({ _id: { $in: ids } })
      .populate('owner_id', 'username display_name avatar_url')
      .sort({ member_count: -1 })
      .exec();
  }
}
