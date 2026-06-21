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
import { UpdateMeetupDto } from './dto/update-meetup.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class MeetupsService {
  constructor(
    @InjectModel(Meetup.name)     private readonly meetupModel: Model<MeetupDocument>,
    @InjectModel(User.name)       private readonly userModel: Model<UserDocument>,
    @InjectModel(CalendarDay.name) private readonly calendarDayModel: Model<CalendarDayDocument>,
    private readonly notifSvc: NotificationsService,
    private readonly activitySvc: ActivityService,
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

    // One RSVP row per invited person (everyone except the proposer).
    const responses = Array.from(participantSet)
      .filter((id) => id !== proposerObjId.toString())
      .map((id) => ({ user_id: new Types.ObjectId(id), status: 'pending' }));

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
      responses,
      status:       'pending',
    });

    await meetup.save();

    // Notify every invited participant (owner + extras), not just the owner —
    // skip the proposer themselves.
    const recipients = Array.from(participantSet).filter(
      (id) => id !== proposerObjId.toString(),
    );
    for (const recipientId of recipients) {
      this.notifSvc.create({
        userId:  new Types.ObjectId(recipientId),
        actorId: proposerObjId,
        type:    'meetup_proposed',
        title:   `New meetup proposed: ${dto.title}`,
        body:    `On ${dto.date}${dto.time ? ' at ' + dto.time : ''}`,
        refId:   meetup._id as Types.ObjectId,
        refModel: 'Meetup',
      }).catch(() => {});
    }

    return meetup;
  }

  async update(
    meetupId: string,
    clerkId: string,
    dto: UpdateMeetupDto,
  ): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.proposer_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the person who planned this meetup can edit it');
    }

    // If the date changes, re-validate against the owner's busy days and daily limit.
    if (dto.date && dto.date !== meetup.date) {
      const busyDay = await this.calendarDayModel.findOne({
        user_id: meetup.owner_id,
        date: dto.date,
        status: 'blocked',
      }).exec();
      if (busyDay) throw new BadRequestException('This user is busy on that date');

      const existingCount = await this.meetupModel.countDocuments({
        owner_id: meetup.owner_id,
        date: dto.date,
        status: { $in: ['pending', 'accepted'] },
        _id: { $ne: meetup._id },
      }).exec();
      if (existingCount >= 3) {
        throw new BadRequestException('This user already has 3 meetups on that date');
      }
    }

    if (dto.date        !== undefined) meetup.date        = dto.date;
    if (dto.time        !== undefined) meetup.time        = dto.time;
    if (dto.title       !== undefined) meetup.title       = dto.title;
    if (dto.description !== undefined) meetup.description = dto.description;
    if (dto.location    !== undefined) meetup.location    = dto.location;

    await meetup.save();
    return this.findById(meetupId);
  }

  async findAllForUser(clerkId: string): Promise<MeetupDocument[]> {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.meetupModel
      .find({ $or: [{ proposer_id: userObjId }, { owner_id: userObjId }, { participants: userObjId }] })
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .populate('responses.user_id', 'username display_name avatar_url')
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findById(id: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel
      .findById(id)
      .populate('proposer_id', 'username display_name avatar_url')
      .populate('owner_id',    'username display_name avatar_url')
      .populate('participants', 'username display_name avatar_url')
      .populate('responses.user_id', 'username display_name avatar_url')
      .exec();
    if (!meetup) throw new NotFoundException('Meetup not found');
    return meetup;
  }

  /**
   * Record one invitee's RSVP independently of the others, then recompute the
   * rollup `status` used for calendar colouring:
   *   accepted  → at least one invitee accepted
   *   declined  → every invitee declined
   *   pending   → still awaiting someone
   * The proposer is not an invitee, so they have no response row.
   */
  private setResponse(
    meetup: MeetupDocument,
    userObjId: Types.ObjectId,
    status: 'accepted' | 'declined',
  ): void {
    const resp = meetup.responses.find(
      r => r.user_id.toString() === userObjId.toString(),
    );
    if (!resp) {
      throw new ForbiddenException('You were not invited to this meetup');
    }
    resp.status = status;
    meetup.markModified('responses');

    const all = meetup.responses.map(r => r.status);
    if (all.some(s => s === 'accepted')) meetup.status = 'accepted';
    else if (all.length > 0 && all.every(s => s === 'declined')) meetup.status = 'declined';
    else meetup.status = 'pending';
  }

  async accept(meetupId: string, clerkId: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    this.setResponse(meetup, userObjId, 'accepted');
    await meetup.save();

    this.activitySvc.record(
      userObjId,
      'meetup_accepted',
      meetup._id as Types.ObjectId,
      'Meetup',
      { title: meetup.title },
    ).catch(() => {});

    // Only the proposer is notified — never the other invitees.
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
    this.setResponse(meetup, userObjId, 'declined');
    await meetup.save();

    // Only the proposer is notified — never the other invitees.
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

  async remove(meetupId: string, clerkId: string): Promise<void> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.proposer_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the person who planned this meetup can delete it');
    }

    await this.meetupModel.deleteOne({ _id: meetup._id }).exec();
  }
}
