import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarDay, CalendarDayDocument } from './schemas/calendar-day.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Friendship, FriendshipDocument } from '../friendships/schemas/friendship.schema';
import { MarkDayDto } from './dto/mark-day.dto';
import { UpdateStickersDto } from './dto/update-stickers.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarDay.name)
    private readonly calendarDayModel: Model<CalendarDayDocument>,
    @InjectModel(Meetup.name)
    private readonly meetupModel: Model<MeetupDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
  ) {}

  async getMonthCalendar(username: string, month: string, viewerClerkId?: string) {
    // month = YYYY-MM
    const user = await this.userModel
      .findOne({ username: username.toLowerCase() })
      .select('_id username display_name avatar_url theme privacy')
      .exec();

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Private account → calendar contents are friends-only. Strangers (and
    // guests) get the user header but an empty month (no days, no meetups).
    if (user.privacy?.private_account === true) {
      const viewer = viewerClerkId
        ? await this.userModel.findOne({ clerk_id: viewerClerkId }).select('_id').exec()
        : null;
      const viewerId = viewer?._id as Types.ObjectId | undefined;
      const isSelf = !!viewerId && viewerId.toString() === user._id.toString();
      if (!isSelf) {
        const isFriend = !!viewerId && !!(await this.friendshipModel
          .findOne({
            status: 'accepted',
            $or: [
              { requester_id: user._id, recipient_id: viewerId },
              { requester_id: viewerId, recipient_id: user._id },
            ],
          })
          .select('_id')
          .exec());
        if (!isFriend) {
          const { privacy: _p, ...publicUser } = user.toObject();
          return { user: publicUser, days: [], meetups: [], private: true };
        }
      }
    }

    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const [days, meetups] = await Promise.all([
      this.calendarDayModel
        .find({
          user_id: user._id,
          date: { $gte: startDate, $lte: endDate },
        })
        .exec(),
      this.meetupModel
        .find({
          $or: [{ proposer_id: user._id }, { owner_id: user._id }, { participants: user._id }],
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['pending', 'accepted'] },
          is_proposal: { $ne: true }, // hide unlocked proposals from the calendar
        })
        .populate('proposer_id', 'username display_name avatar_url theme')
        .populate('owner_id', 'username display_name avatar_url theme')
        .populate('participants', 'username display_name avatar_url theme')
        .populate('responses.user_id', 'username display_name avatar_url theme')
        .exec(),
    ]);

    return { user, days, meetups };
  }

  async markDay(clerkId: string, dto: MarkDayDto): Promise<CalendarDayDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    const userObjId = user._id as Types.ObjectId;

    const day = await this.calendarDayModel
      .findOneAndUpdate(
        { user_id: userObjId, date: dto.date },
        { $set: { status: dto.status } },
        { upsert: true, new: true },
      )
      .exec();
    return day;
  }

  async updateStickers(clerkId: string, dto: UpdateStickersDto): Promise<CalendarDayDocument> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User profile not found');
    const userObjId = user._id as Types.ObjectId;

    const day = await this.calendarDayModel
      .findOneAndUpdate(
        { user_id: userObjId, date: dto.date },
        { $set: { stickers: dto.stickers } },
        { upsert: true, new: true },
      )
      .exec();
    return day;
  }
}
