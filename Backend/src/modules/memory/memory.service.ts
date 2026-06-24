import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { effectivePremium } from '../../common/feature-flags';

@Injectable()
export class MemoryService {
  constructor(
    @InjectModel(Meetup.name) private readonly meetupModel: Model<MeetupDocument>,
    @InjectModel(User.name)   private readonly userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async resolveUser(clerkId: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  /** Any invited participant (proposer / owner / participants) may add photos. */
  private assertParticipant(meetup: MeetupDocument, userObjId: Types.ObjectId): void {
    const isParticipant =
      meetup.proposer_id.toString() === userObjId.toString() ||
      meetup.owner_id.toString() === userObjId.toString() ||
      meetup.participants.some(p => p.toString() === userObjId.toString());
    if (!isParticipant) {
      throw new ForbiddenException('You were not part of this meetup');
    }
  }

  private populated(meetupId: string): Promise<MeetupDocument> {
    return this.meetupModel
      .findById(meetupId)
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id', 'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .populate('memory_photos.added_by', 'username display_name avatar_url')
      .exec() as Promise<MeetupDocument>;
  }

  async uploadPhoto(
    clerkId: string,
    meetupId: string,
    file: Express.Multer.File,
  ): Promise<MeetupDocument> {
    const user = await this.resolveUser(clerkId);

    if (!effectivePremium(user.is_premium)) {
      throw new ForbiddenException('Memory photos require a premium account');
    }

    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = user._id as Types.ObjectId;
    this.assertParticipant(meetup, userObjId);

    if (meetup.status !== 'accepted') {
      throw new ForbiddenException('Can only add photos to accepted meetups');
    }

    // Each participant may add up to 5 photos to a memory.
    const myPhotoCount = (meetup.memory_photos as unknown as Array<{ added_by: Types.ObjectId }>)
      .filter(p => p.added_by?.toString() === userObjId.toString())
      .length;
    if (myPhotoCount >= 5) {
      throw new ForbiddenException('You can add at most 5 photos to this memory');
    }

    const result = await this.cloudinaryService.uploadFile(file, 'helloxxx/memories') as { secure_url: string };
    meetup.memory_photos.push({
      url: result.secure_url,
      added_by: userObjId,
      added_at: new Date(),
    });
    await meetup.save();

    return this.populated(meetupId);
  }

  /** A photo may be removed by whoever added it, or by the meetup owner. */
  async deletePhoto(
    clerkId: string,
    meetupId: string,
    photoId: string,
  ): Promise<MeetupDocument> {
    const user = await this.resolveUser(clerkId);
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = user._id as Types.ObjectId;
    const photo = (meetup.memory_photos as unknown as Array<{ _id: Types.ObjectId; url: string; added_by: Types.ObjectId }>)
      .find(p => p._id.toString() === photoId);
    if (!photo) throw new NotFoundException('Photo not found');

    const canDelete =
      photo.added_by.toString() === userObjId.toString() ||
      meetup.owner_id.toString() === userObjId.toString();
    if (!canDelete) throw new ForbiddenException('Cannot remove this photo');

    // Remove from Cloudinary
    const parts = photo.url.split('/');
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
    await this.cloudinaryService.deleteFile(publicId).catch(() => null);

    meetup.memory_photos = (meetup.memory_photos as unknown as Array<{ _id: Types.ObjectId }>)
      .filter(p => p._id.toString() !== photoId) as unknown as typeof meetup.memory_photos;
    await meetup.save();

    return this.populated(meetupId);
  }

  async getAlbum(clerkId: string): Promise<MeetupDocument[]> {
    const user = await this.resolveUser(clerkId);
    const userObjId = user._id as Types.ObjectId;

    return this.meetupModel
      .find({
        $or: [
          { proposer_id: userObjId },
          { owner_id: userObjId },
          { participants: userObjId },
        ],
        status: 'accepted',
      })
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .populate('memory_photos.added_by', 'username display_name avatar_url')
      .sort({ date: -1 })
      .exec();
  }
}
