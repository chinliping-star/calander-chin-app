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
import { CreateProposalDto } from './dto/create-proposal.dto';
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
    if (existingCount >= 4) {
      throw new BadRequestException('This user already has 4 meetups on that date');
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

  // ── Proposals (poll-style voting) ──────────────────────────────────────────

  /** Create a poll meetup: invitees vote a slot before it becomes real. */
  async createProposal(proposerClerkId: string, dto: CreateProposalDto): Promise<MeetupDocument> {
    const proposerObjId = await this.resolveMongoId(proposerClerkId);

    const extraParticipants = (dto.participants ?? []).map((id) => new Types.ObjectId(id));
    const participantSet = new Set<string>([
      proposerObjId.toString(),
      ...extraParticipants.map((p) => p.toString()),
    ]);

    // One RSVP row per invited person (everyone except the proposer).
    const responses = Array.from(participantSet)
      .filter((id) => id !== proposerObjId.toString())
      .map((id) => ({ user_id: new Types.ObjectId(id), status: 'pending' }));

    // Top-level date is a placeholder (first slot) until a slot locks.
    const firstSlot = dto.slots[0];

    const meetup = new this.meetupModel({
      proposer_id:    proposerObjId,
      owner_id:       proposerObjId, // group poll — proposer hosts
      date:           firstSlot.date,
      time:           firstSlot.time ?? '',
      title:          dto.title,
      description:    dto.description,
      location:       firstSlot.location ?? '',
      participants:   Array.from(participantSet).map((id) => new Types.ObjectId(id)),
      responses,
      status:         'pending',
      is_proposal:    true,
      proposed_slots: dto.slots.map((s) => ({
        date: s.date, time: s.time ?? '', location: s.location ?? '',
      })),
      slot_votes:     [],
      locked_slot_id: null,
    });

    await meetup.save();

    // Notify every invitee to vote.
    for (const recipientId of participantSet) {
      if (recipientId === proposerObjId.toString()) continue;
      this.notifSvc.create({
        userId:   new Types.ObjectId(recipientId),
        actorId:  proposerObjId,
        type:     'meetup_proposed',
        title:    `Vote on a time: ${dto.title}`,
        body:     `${dto.slots.length} time option${dto.slots.length > 1 ? 's' : ''} to pick from`,
        refId:    meetup._id as Types.ObjectId,
        refModel: 'Meetup',
      }).catch(() => {});
    }

    return this.findById((meetup._id as Types.ObjectId).toString());
  }

  /** Record one invitee's single-select vote (re-voting moves it). */
  async voteSlot(meetupId: string, clerkId: string, slotId: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');
    if (!meetup.is_proposal) throw new BadRequestException('This meetup is not a proposal');
    if (meetup.locked_slot_id) throw new BadRequestException('Voting has closed for this proposal');

    const userObjId = await this.resolveMongoId(clerkId);

    const isParticipant = meetup.participants.some((p) => p.toString() === userObjId.toString());
    if (!isParticipant) throw new ForbiddenException('You were not invited to this proposal');

    const slotExists = meetup.proposed_slots.some((s) => s._id.toString() === slotId);
    if (!slotExists) throw new BadRequestException('Unknown slot');

    // Single vote: drop any prior vote by this user, then add the new one.
    meetup.slot_votes = meetup.slot_votes.filter((v) => v.user_id.toString() !== userObjId.toString());
    meetup.slot_votes.push({ slot_id: new Types.ObjectId(slotId), user_id: userObjId });
    meetup.markModified('slot_votes');
    await meetup.save();

    // Batched ping to proposer — one live notification, updated each vote.
    const voterCount = new Set(meetup.slot_votes.map((v) => v.user_id.toString())).size;
    const inviteeCount = meetup.participants.length - 1;
    this.notifSvc.upsert({
      userId:   meetup.proposer_id as Types.ObjectId,
      actorId:  userObjId,
      type:     'meetup_voted',
      title:    `${voterCount}/${inviteeCount} voted on: ${meetup.title}`,
      body:     'Tap to review and lock a time',
      refId:    meetup._id as Types.ObjectId,
      refModel: 'Meetup',
    }).catch(() => {});

    return this.findById(meetupId);
  }

  /** Proposer locks a slot (explicit slotId) or auto-locks the top-voted one. */
  async lockSlot(meetupId: string, clerkId: string, slotId?: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel.findById(meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');
    if (!meetup.is_proposal) throw new BadRequestException('This meetup is not a proposal');
    if (meetup.locked_slot_id) throw new BadRequestException('A slot is already locked');

    const userObjId = await this.resolveMongoId(clerkId);
    if (meetup.proposer_id.toString() !== userObjId.toString()) {
      throw new ForbiddenException('Only the proposer can lock a slot');
    }

    // Resolve the winning slot id.
    let winningId = slotId;
    if (!winningId) {
      // Auto: tally votes, pick the highest (ties → earliest slot in the list).
      const tally = new Map<string, number>();
      for (const v of meetup.slot_votes) {
        const k = v.slot_id.toString();
        tally.set(k, (tally.get(k) ?? 0) + 1);
      }
      let best = -1;
      for (const slot of meetup.proposed_slots) {
        const c = tally.get(slot._id.toString()) ?? 0;
        if (c > best) { best = c; winningId = slot._id.toString(); }
      }
    }

    const slot = meetup.proposed_slots.find((s) => s._id.toString() === winningId);
    if (!slot) throw new BadRequestException('Unknown slot');

    // Promote the slot to the real meetup.
    meetup.date = slot.date;
    meetup.time = slot.time;
    meetup.location = slot.location;
    meetup.locked_slot_id = slot._id;
    meetup.is_proposal = false;
    meetup.status = 'accepted';

    // Whoever voted the winning slot counts as accepted.
    const winnerVoters = new Set(
      meetup.slot_votes
        .filter((v) => v.slot_id.toString() === slot._id.toString())
        .map((v) => v.user_id.toString()),
    );
    for (const r of meetup.responses) {
      if (winnerVoters.has(r.user_id.toString())) r.status = 'accepted';
    }
    meetup.markModified('responses');
    await meetup.save();

    // Notify all invitees the time is confirmed.
    for (const p of meetup.participants) {
      if (p.toString() === userObjId.toString()) continue;
      this.notifSvc.create({
        userId:   p as Types.ObjectId,
        actorId:  userObjId,
        type:     'meetup_confirmed',
        title:    `Confirmed: ${meetup.title}`,
        body:     `${slot.date}${slot.time ? ' at ' + slot.time : ''}${slot.location ? ' · ' + slot.location : ''}`,
        refId:    meetup._id as Types.ObjectId,
        refModel: 'Meetup',
      }).catch(() => {});
    }

    return this.findById(meetupId);
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
      if (existingCount >= 4) {
        throw new BadRequestException('This user already has 4 meetups on that date');
      }
    }

    if (dto.date        !== undefined) meetup.date        = dto.date;
    if (dto.time        !== undefined) meetup.time        = dto.time;
    if (dto.title       !== undefined) meetup.title       = dto.title;
    if (dto.description !== undefined) meetup.description = dto.description;
    if (dto.location    !== undefined) meetup.location    = dto.location;

    // Re-invite friends: dto.participants is the full extra-invitee set.
    if (dto.participants !== undefined) {
      const proposerId = meetup.proposer_id.toString();
      const ownerId    = meetup.owner_id.toString();
      const wanted = new Set<string>([
        proposerId,
        ownerId,
        ...dto.participants,
      ]);

      const previousInvitees = new Set(
        meetup.participants.map((p) => p.toString()).filter((id) => id !== proposerId),
      );

      meetup.participants = Array.from(wanted).map((id) => new Types.ObjectId(id));

      // Keep RSVP rows for people still invited; drop the rest.
      meetup.responses = meetup.responses.filter((r) => wanted.has(r.user_id.toString()));
      // Add a pending RSVP row for any newly invited person (everyone except proposer).
      const haveResponse = new Set(meetup.responses.map((r) => r.user_id.toString()));
      const newlyInvited: string[] = [];
      for (const id of wanted) {
        if (id === proposerId) continue;
        if (!haveResponse.has(id)) {
          meetup.responses.push({ user_id: new Types.ObjectId(id), status: 'pending' });
          if (!previousInvitees.has(id)) newlyInvited.push(id);
        }
      }
      meetup.markModified('responses');

      // Recompute rollup status from the new response set.
      const all = meetup.responses.map((r) => r.status);
      if (all.some((s) => s === 'accepted')) meetup.status = 'accepted';
      else if (all.length > 0 && all.every((s) => s === 'declined')) meetup.status = 'declined';
      else meetup.status = 'pending';

      // Notify freshly invited people.
      for (const recipientId of newlyInvited) {
        this.notifSvc.create({
          userId:   new Types.ObjectId(recipientId),
          actorId:  userObjId,
          type:     'meetup_proposed',
          title:    `You were invited: ${meetup.title}`,
          body:     `On ${meetup.date}${meetup.time ? ' at ' + meetup.time : ''}`,
          refId:    meetup._id as Types.ObjectId,
          refModel: 'Meetup',
        }).catch(() => {});
      }
    }

    await meetup.save();
    return this.findById(meetupId);
  }

  async findAllForUser(clerkId: string): Promise<MeetupDocument[]> {
    const userObjId = await this.resolveMongoId(clerkId);
    return this.meetupModel
      .find({ $or: [{ proposer_id: userObjId }, { owner_id: userObjId }, { participants: userObjId }] })
      .populate('proposer_id', 'username display_name avatar_url theme')
      .populate('owner_id',    'username display_name avatar_url theme')
      .populate('participants', 'username display_name avatar_url theme')
      .populate('responses.user_id', 'username display_name avatar_url theme')
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findById(id: string): Promise<MeetupDocument> {
    const meetup = await this.meetupModel
      .findById(id)
      .populate('proposer_id', 'username display_name avatar_url theme')
      .populate('owner_id',    'username display_name avatar_url theme')
      .populate('participants', 'username display_name avatar_url theme')
      .populate('responses.user_id', 'username display_name avatar_url theme')
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
