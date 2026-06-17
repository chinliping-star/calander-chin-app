import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarDay, CalendarDayDocument } from './schemas/calendar-day.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
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
  ) {}

  async getMonthCalendar(username: string, month: string) {
    // month = YYYY-MM
    const user = await this.userModel
      .findOne({ username: username.toLowerCase() })
      .select('_id username display_name avatar_url theme')
      .exec();

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
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
          $or: [{ proposer_id: user._id }, { owner_id: user._id }],
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['pending', 'accepted'] },
        })
        .populate('proposer_id', 'username display_name avatar_url')
        .populate('owner_id', 'username display_name avatar_url')
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
