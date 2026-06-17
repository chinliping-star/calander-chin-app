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

  async uploadPhoto(
    clerkId: string,
    meetupId: string,
    file: Express.Multer.File,
  ): Promise<MeetupDocument> {
    const user = await this.resolveUser(clerkId);

    if (!user.is_premium) {
      throw new ForbiddenException('Memory photos require a premium account');
    }

    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = user._id as Types.ObjectId;
    const isParticipant =
      meetup.proposer_id.toString() === userObjId.toString() ||
      meetup.owner_id.toString() === userObjId.toString() ||
      meetup.participants.some(p => p.toString() === userObjId.toString());

    if (!isParticipant) {
      throw new ForbiddenException('You were not part of this meetup');
    }

    if (meetup.status !== 'accepted') {
      throw new ForbiddenException('Can only add photos to accepted meetups');
    }

    // Delete old photo from Cloudinary if exists
    if (meetup.memory_photo_url) {
      const parts = meetup.memory_photo_url.split('/');
      const fileWithExt = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
      await this.cloudinaryService.deleteFile(publicId).catch(() => null);
    }

    const result = await this.cloudinaryService.uploadFile(file, 'helloxxx/memories') as { secure_url: string };
    meetup.memory_photo_url = result.secure_url;
    await meetup.save();

    return this.meetupModel
      .findById(meetupId)
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id', 'username display_name avatar_url')
      .exec() as Promise<MeetupDocument>;
  }

  async deletePhoto(clerkId: string, meetupId: string): Promise<MeetupDocument> {
    const user = await this.resolveUser(clerkId);
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = user._id as Types.ObjectId;
    const isParticipant =
      meetup.proposer_id.toString() === userObjId.toString() ||
      meetup.owner_id.toString() === userObjId.toString();

    if (!isParticipant) throw new ForbiddenException('Cannot remove this photo');
    if (!meetup.memory_photo_url) throw new NotFoundException('No photo to delete');

    const parts = meetup.memory_photo_url.split('/');
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
    await this.cloudinaryService.deleteFile(publicId).catch(() => null);

    meetup.memory_photo_url = undefined as unknown as string;
    await meetup.save();

    return meetup;
  }

  async getAlbum(clerkId: string): Promise<MeetupDocument[]> {
    const user = await this.resolveUser(clerkId);
    const userObjId = user._id as Types.ObjectId;

    return this.meetupModel
      .find({
        $or: [{ proposer_id: userObjId }, { owner_id: userObjId }],
        status: 'accepted',
      })
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .sort({ date: -1 })
      .exec();
  }
}
