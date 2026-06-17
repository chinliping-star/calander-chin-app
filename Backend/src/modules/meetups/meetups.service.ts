import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meetup, MeetupDocument } from './schemas/meetup.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CalendarDay, CalendarDayDocument } from '../calendar/schemas/calendar-day.schema';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MeetupsService {
  constructor(
    @InjectModel(Meetup.name)     private readonly meetupModel: Model<MeetupDocument>,
    @InjectModel(User.name)       private readonly userModel: Model<UserDocument>,
    @InjectModel(CalendarDay.name) private readonly calendarDayModel: Model<CalendarDayDocument>,
    private readonly notifSvc: NotificationsService,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    return user._id as Types.ObjectId;
  }

  async create(proposerClerkId: string, dto: CreateMeetupDto): Promise<MeetupDocument> {
    const proposerObjId = await this.resolveMongoId(proposerClerkId);
    const ownerObjId    = new Types.ObjectId(dto.owner_id);

    // Block if owner has this date marked as busy
    const busyDay = await this.calendarDayModel.findOne({
      user_id: ownerObjId,
      date: dto.date,
      status: 'blocked',
    }).exec();
    if (busyDay) {
      throw new BadRequestException('This user is busy on that date');
    }

    // Also block if proposer proposing to themselves on a busy day
    if (ownerObjId.equals(proposerObjId)) {
      const selfBusy = await this.calendarDayModel.findOne({
        user_id: proposerObjId,
        date: dto.date,
        status: 'blocked',
      }).exec();
      if (selfBusy) {
        throw new BadRequestException('You have marked that date as busy');
      }
    }

    // Check 3-meetup limit for owner on this date
    const existingCount = await this.meetupModel.countDocuments({
      owner_id: ownerObjId,
      date: dto.date,
      status: { $in: ['pending', 'accepted'] },
    }).exec();
    if (existingCount >= 3) {
      throw new BadRequestException('This user already has 3 meetups on that date');
    }

    const extraParticipants = dto.participants
      ? dto.participants.map((id) => new Types.ObjectId(id))
      : [];

    const participantSet = new Set([
      proposerObjId.toString(),
      ownerObjId.toString(),
      ...extraParticipants.map((p) => p.toString()),
    ]);

    const meetup = new this.meetupModel({
      proposer_id:  proposerObjId,
      owner_id:     ownerObjId,
      date:         dto.date,
      time:         dto.time,
      title:        dto.title,
      description:  dto.description,
      location:     dto.location,
      is_private:   dto.is_private ?? false,
      participants: Array.from(participantSet).map((id) => new Types.ObjectId(id)),
      status:       'pending',
    });

    await meetup.save();

    this.notifSvc.create({
      userId:  ownerObjId,
      actorId: proposerObjId,
      type:    'meetup_proposed',
      title:   `New meetup proposed: ${dto.title}`,
      body:    `On ${dto.date}${dto.time ? ' at ' + dto.time : ''}`,
      refId:   meetup._id as Types.ObjectId,
      refModel: 'Meetup',
    }).catch(() => {});

    return meetup;
  }

  async findAllForUser(clerkId: string): Promise<MeetupDocument[]> {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.meetupModel
      .find({ $or: [{ proposer_id: userObjId }, { owner_id: userObjId }] })
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findById(id: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel
      .findById(id)
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .exec();
    if (!meetup) throw new NotFoundException('Meetup not found');
    return meetup;
  }

  async accept(meetupId: string, clerkId: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.owner_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the owner can accept this meetup');
    }
    if (meetup.status !== 'pending') {
      throw new ForbiddenException(`Cannot accept a meetup with status '${meetup.status}'`);
    }

    meetup.status = 'accepted';
    await meetup.save();

    this.notifSvc.create({
      userId:  meetup.proposer_id as Types.ObjectId,
      actorId: userObjId,
      type:    'meetup_accepted',
      title:   `Your meetup was accepted`,
      body:    meetup.title,
      refId:   meetup._id as Types.ObjectId,
      refModel: 'Meetup',
    }).catch(() => {});

    return this.findById(meetupId);
  }

  async decline(meetupId: string, clerkId: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.owner_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the owner can decline this meetup');
    }
    if (meetup.status !== 'pending') {
      throw new ForbiddenException(`Cannot decline a meetup with status '${meetup.status}'`);
    }

    meetup.status = 'declined';
    await meetup.save();

    this.notifSvc.create({
      userId:  meetup.proposer_id as Types.ObjectId,
      actorId: userObjId,
      type:    'meetup_declined',
      title:   `Your meetup was declined`,
      body:    meetup.title,
      refId:   meetup._id as Types.ObjectId,
      refModel: 'Meetup',
    }).catch(() => {});

    return this.findById(meetupId);
  }

  async cancel(meetupId: string, clerkId: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.proposer_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the proposer can cancel this meetup');
    }
    if (meetup.status === 'cancelled') {
      throw new ForbiddenException('Meetup is already cancelled');
    }

    meetup.status = 'cancelled';
    await meetup.save();
    return this.findById(meetupId);
  }
}
