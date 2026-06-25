import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createClerkClient } from '@clerk/backend';
import { User, UserDocument } from './schemas/user.schema';
import { Friendship, FriendshipDocument } from '../friendships/schemas/friendship.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { Community, CommunityDocument } from '../communities/schemas/community.schema';
import { CommunityMember, CommunityMemberDocument } from '../communities/schemas/community-member.schema';
import { CommunityPost, CommunityPostDocument } from '../communities/schemas/community-post.schema';
import { Rsvp, RsvpDocument } from '../rsvp/schemas/rsvp.schema';
import { UpdateUserDto } from './dto/update-user.dto';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/** Shape of a User after `.populate(...'username display_name avatar_url _id')`. */
interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)            private readonly userModel: Model<UserDocument>,
    @InjectModel(Friendship.name)      private readonly friendshipModel: Model<FriendshipDocument>,
    @InjectModel(Meetup.name)          private readonly meetupModel: Model<MeetupDocument>,
    @InjectModel(Community.name)        private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(CommunityMember.name)  private readonly memberModel: Model<CommunityMemberDocument>,
    @InjectModel(CommunityPost.name)    private readonly postModel: Model<CommunityPostDocument>,
    @InjectModel(Rsvp.name)             private readonly rsvpModel: Model<RsvpDocument>,
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

  async updateCover(clerkId: string, coverUrl: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ clerk_id: clerkId }, { $set: { banner_url: coverUrl } }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Aggregated public profile data for the tabs on a user's profile page:
   * friends, recent meetups, interests, communities (clubs), and bookings
   * (events the user has RSVP'd "going" to). Public — no viewer context.
   */
  async getProfileData(username: string) {
    const user = await this.userModel
      .findOne({ username: username.toLowerCase(), deleted_at: null })
      .select('_id interests')
      .lean()
      .exec();
    if (!user) throw new NotFoundException(`User @${username} not found`);
    const userId = user._id as Types.ObjectId;

    // ── Friends (accepted both directions) ──────────────────────────────────
    const friendships = await this.friendshipModel
      .find({ $or: [{ requester_id: userId }, { recipient_id: userId }], status: 'accepted' })
      .populate('requester_id', 'username display_name avatar_url _id')
      .populate('recipient_id', 'username display_name avatar_url _id')
      .lean()
      .exec();
    const friends = friendships.flatMap((f) => {
      const req = f.requester_id as unknown as PopulatedUser | null;
      const rec = f.recipient_id as unknown as PopulatedUser | null;
      if (!req || !rec) return [];
      const friend = req._id.toString() === userId.toString() ? rec : req;
      if (friend.username?.startsWith('__deleted__')) return [];
      return [{
        _id: friend._id,
        username: friend.username,
        display_name: friend.display_name ?? friend.username,
        avatar_url: friend.avatar_url ?? '',
      }];
    });

    // ── Meetups (accepted), with the counterpart relative to this user ──────
    const meetupDocs = await this.meetupModel
      .find({ status: 'accepted', $or: [{ proposer_id: userId }, { owner_id: userId }, { participants: userId }] })
      .populate('proposer_id', 'username display_name avatar_url _id')
      .populate('owner_id', 'username display_name avatar_url _id')
      .sort({ date: -1 })
      .lean()
      .exec();
    const meetups = meetupDocs.flatMap((m) => {
      const proposer = m.proposer_id as unknown as PopulatedUser | null;
      const owner = m.owner_id as unknown as PopulatedUser | null;
      const counterpart = proposer?._id?.toString() === userId.toString() ? owner : proposer;
      if (counterpart && counterpart.username?.startsWith('__deleted__')) return [];
      return [{
        _id: m._id,
        title: m.title,
        date: m.date,
        time: m.time,
        location: m.location ?? '',
        status: m.status,
        with: counterpart
          ? {
              username: counterpart.username,
              display_name: counterpart.display_name ?? counterpart.username,
              avatar_url: counterpart.avatar_url ?? '',
            }
          : null,
      }];
    });

    // ── Communities (clubs the user belongs to) ─────────────────────────────
    const memberships = await this.memberModel.find({ user_id: userId }).select('community_id').lean().exec();
    const communityIds = memberships.map((mm) => mm.community_id);
    const communities = await this.communityModel
      .find({ _id: { $in: communityIds } })
      .select('name slug avatar_url category member_count')
      .sort({ member_count: -1 })
      .lean()
      .exec();

    // ── Bookings = events the user RSVP'd "going" to ────────────────────────
    const rsvps = await this.rsvpModel.find({ user_id: userId, status: 'going' }).select('event_id').lean().exec();
    const eventIds = rsvps.map((r) => r.event_id);
    const events = await this.postModel
      .find({ _id: { $in: eventIds }, type: 'event' })
      .populate('community_id', 'name slug')
      .sort({ event_date: 1 })
      .lean()
      .exec();
    const bookings = events.map((e) => {
      const community = e.community_id as unknown as { name?: string; slug?: string } | null;
      return {
        _id: e._id,
        title: e.title,
        content: e.content,
        event_date: e.event_date,
        event_location: e.event_location ?? '',
        community: community ? { name: community.name ?? '', slug: community.slug ?? '' } : null,
      };
    });

    return {
      interests: user.interests ?? [],
      counts: { friends: friends.length, meetups: meetups.length, communities: communities.length },
      friends,
      meetups,
      communities,
      bookings,
    };
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
