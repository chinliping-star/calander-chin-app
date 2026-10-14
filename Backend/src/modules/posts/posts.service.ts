import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Friendship, FriendshipDocument } from '../friendships/schemas/friendship.schema';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';
import { ActivityService } from '../activity/activity.service';
import { ReportsService } from '../reports/reports.service';
import { ModerationService } from '../reports/moderation.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)       private readonly postModel:       Model<PostDocument>,
    @InjectModel(User.name)       private readonly userModel:       Model<UserDocument>,
    @InjectModel(Friendship.name) private readonly friendshipModel: Model<FriendshipDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly activitySvc: ActivityService,
    private readonly reportsSvc: ReportsService,
    private readonly moderationSvc: ModerationService,
    private readonly coinsSvc: CoinsService,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  private async areFriends(aId: Types.ObjectId, bId: Types.ObjectId): Promise<boolean> {
    const f = await this.friendshipModel.findOne({
      status: 'accepted',
      $or: [
        { requester_id: aId, recipient_id: bId },
        { requester_id: bId, recipient_id: aId },
      ],
    }).exec();
    return !!f;
  }

  /** Author + comment authors, so the client can render names and avatars. */
  private withPeople(id: Types.ObjectId | string) {
    return this.postModel
      .findById(id)
      .populate('author_id', 'username display_name avatar_url _id')
      .populate('comments.author_id', 'username display_name avatar_url _id')
      .exec() as Promise<PostDocument>;
  }

  /** Same rule as the feeds: author sees all, friends see public+friends, others public. */
  private async loadVisiblePost(postId: string, viewerId: Types.ObjectId): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(postId)) throw new NotFoundException('Post not found');
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    const authorId = post.author_id as Types.ObjectId;
    if (authorId.toString() === viewerId.toString()) return post;
    if (post.privacy === 'public') return post;
    if (post.privacy === 'friends' && await this.areFriends(viewerId, authorId)) return post;
    // Hide existence of posts the viewer cannot see.
    throw new NotFoundException('Post not found');
  }

  // ── Public feed for a user's profile page ─────────────────────────────────

  async getPostsByUsername(
    username: string,
    viewerClerkId?: string,
  ): Promise<PostDocument[]> {
    const author = await this.userModel.findOne({ username }).select('_id').exec();
    if (!author) throw new NotFoundException('User not found');
    const authorId = author._id as Types.ObjectId;

    let allowedPrivacy: string[];

    if (!viewerClerkId) {
      // Guest — public only
      allowedPrivacy = ['public'];
    } else {
      const viewerId = await this.resolveMongoId(viewerClerkId);
      if (viewerId.toString() === authorId.toString()) {
        // Own profile — all posts
        allowedPrivacy = ['public', 'friends', 'private'];
      } else if (await this.areFriends(viewerId, authorId)) {
        allowedPrivacy = ['public', 'friends'];
      } else {
        allowedPrivacy = ['public'];
      }
    }

    return this.postModel
      .find({ author_id: authorId, privacy: { $in: allowedPrivacy } })
      .populate('author_id', 'username display_name avatar_url _id')
      .populate('comments.author_id', 'username display_name avatar_url _id')
      .sort({ created_at: -1 })
      .exec();
  }

  // ── Friend feed ───────────────────────────────────────────────────────────

  async getFeed(clerkId: string, page = 1, limit = 20): Promise<PostDocument[]> {
    const userId = await this.resolveMongoId(clerkId);

    const friendships = await this.friendshipModel.find({
      status: 'accepted',
      $or: [{ requester_id: userId }, { recipient_id: userId }],
    }).select('requester_id recipient_id').exec();

    const friendIds = friendships.map(f =>
      f.requester_id.toString() === userId.toString() ? f.recipient_id : f.requester_id,
    );

    return this.postModel
      .find({
        author_id: { $in: friendIds },
        privacy: { $in: ['public', 'friends'] },
      })
      .populate('author_id', 'username display_name avatar_url _id')
      .populate('comments.author_id', 'username display_name avatar_url _id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(
    clerkId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostDocument> {
    const authorId = await this.resolveMongoId(clerkId);

    let image_url: string | undefined;
    let image_public_id: string | undefined;

    if (file) {
      const result = await this.cloudinaryService.uploadFile(file, 'helloxxx/posts');
      if ('secure_url' in result) {
        image_url = result.secure_url;
        image_public_id = result.public_id;
      }
    }

    const post = new this.postModel({
      author_id: authorId,
      type: dto.type ?? (file ? 'image' : 'text'),
      content: dto.content,
      title: dto.title,
      privacy: dto.privacy ?? 'friends',
      image_url,
      image_public_id,
      meetup_ref: dto.meetup_ref ? new Types.ObjectId(dto.meetup_ref) : undefined,
    });
    await post.save();

    // Coins: more for posting a picture. Daily-capped in CoinsService.
    void this.coinsSvc.award(authorId, image_url ? 'post_photo' : 'post_created', String(post._id));

    // Auto-moderation: scan content; auto-file a report for human review if flagged.
    const scan = this.moderationSvc.scan(`${dto.title ?? ''} ${dto.content ?? ''}`);
    if (scan.flagged && scan.reason) {
      this.reportsSvc.createAuto('post', post._id as Types.ObjectId, scan.reason, scan.detail).catch(() => {});
    }

    // Only surface non-private posts in the friend activity feed.
    if (post.privacy !== 'private') {
      this.activitySvc.record(
        authorId,
        'post_created',
        post._id as Types.ObjectId,
        'Post',
        post.title ? { title: post.title } : undefined,
      ).catch(() => {});
    }

    return this.withPeople(post._id as Types.ObjectId);
  }

  async update(clerkId: string, postId: string, dto: UpdatePostDto): Promise<PostDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author_id.toString() !== userId.toString()) throw new ForbiddenException('Author only');

    Object.assign(post, dto);
    await post.save();

    return this.withPeople(post._id as Types.ObjectId);
  }

  async delete(clerkId: string, postId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author_id.toString() !== userId.toString()) throw new ForbiddenException('Author only');

    if (post.image_public_id) {
      await this.cloudinaryService.deleteFile(post.image_public_id);
    }

    await this.postModel.findByIdAndDelete(postId).exec();
  }

  // ── Reactions + comments ──────────────────────────────────────────────────

  async react(
    clerkId: string,
    postId: string,
    reaction: 'like' | 'dislike' | 'none',
  ): Promise<PostDocument> {
    const userId = await this.resolveMongoId(clerkId);
    await this.loadVisiblePost(postId, userId);

    // Pull from both lists, then add to the chosen one — atomic, no double votes.
    await this.postModel.updateOne({ _id: postId }, { $pull: { likes: userId, dislikes: userId } }).exec();
    if (reaction === 'like') {
      await this.postModel.updateOne({ _id: postId }, { $addToSet: { likes: userId } }).exec();
    } else if (reaction === 'dislike') {
      await this.postModel.updateOne({ _id: postId }, { $addToSet: { dislikes: userId } }).exec();
    }
    return this.withPeople(postId);
  }

  async addComment(clerkId: string, postId: string, content: string): Promise<PostDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const post = await this.loadVisiblePost(postId, userId);
    const text = content.trim();
    if (!text) throw new BadRequestException('Comment cannot be empty');

    await this.postModel.updateOne(
      { _id: post._id },
      { $push: { comments: { author_id: userId, content: text, created_at: new Date() } } },
    ).exec();

    const scan = this.moderationSvc.scan(text);
    if (scan.flagged && scan.reason) {
      this.reportsSvc.createAuto('post', post._id as Types.ObjectId, scan.reason, scan.detail).catch(() => {});
    }
    return this.withPeople(post._id as Types.ObjectId);
  }

  /** Comment author or post author can delete a comment. */
  async deleteComment(clerkId: string, postId: string, commentId: string): Promise<PostDocument> {
    const userId = await this.resolveMongoId(clerkId);
    const post = await this.loadVisiblePost(postId, userId);
    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const isCommentAuthor = comment.author_id.toString() === userId.toString();
    const isPostAuthor = post.author_id.toString() === userId.toString();
    if (!isCommentAuthor && !isPostAuthor) throw new ForbiddenException('Not allowed');

    await this.postModel.updateOne(
      { _id: post._id },
      { $pull: { comments: { _id: comment._id } } },
    ).exec();
    return this.withPeople(post._id as Types.ObjectId);
  }
}
