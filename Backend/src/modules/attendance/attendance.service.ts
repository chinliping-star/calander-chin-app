import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Meetup, MeetupDocument } from '../meetups/schemas/meetup.schema';
import { MarkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name)       private readonly userModel:       Model<UserDocument>,
    @InjectModel(Meetup.name)     private readonly meetupModel:     Model<MeetupDocument>,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User not found');
    return user._id as Types.ObjectId;
  }

  async mark(clerkId: string, dto: MarkAttendanceDto): Promise<AttendanceDocument> {
    const userId  = await this.resolveMongoId(clerkId);
    const meetup  = await this.meetupModel.findById(dto.meetupId).exec();
    if (!meetup) throw new NotFoundException('Meetup not found');
    if (meetup.status !== 'accepted') throw new ForbiddenException('Can only mark attendance on accepted meetups');

    // Must be past meetup
    const meetupDate = new Date(meetup.date);
    if (meetupDate > new Date()) throw new ForbiddenException('Cannot mark attendance for future meetups');

    const isParticipant =
      meetup.proposer_id.toString() === userId.toString() ||
      meetup.owner_id.toString()    === userId.toString() ||
      meetup.participants.some((p: Types.ObjectId) => p.toString() === userId.toString());

    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const record = await this.attendanceModel.findOneAndUpdate(
      { meetup_id: new Types.ObjectId(dto.meetupId), user_id: userId },
      { $set: { status: dto.status, marked_at: new Date() } },
      { upsert: true, new: true },
    ).exec();

    // Update attendance_score on user
    await this.recalcScore(userId);

    return record!;
  }

  async getMyAttendance(clerkId: string): Promise<{ meetup_id: string; status: string }[]> {
    const userId = await this.resolveMongoId(clerkId);
    const records = await this.attendanceModel
      .find({ user_id: userId })
      .select('meetup_id status')
      .lean()
      .exec();
    return records.map(r => ({ meetup_id: r.meetup_id.toString(), status: r.status }));
  }

  async getForMeetup(meetupId: string): Promise<AttendanceDocument[]> {
    return this.attendanceModel
      .find({ meetup_id: new Types.ObjectId(meetupId) })
      .populate('user_id', 'username display_name avatar_url')
      .exec();
  }

  async getUserStats(clerkId: string): Promise<{ attended: number; missed: number; skipped: number; score: number }> {
    const userId = await this.resolveMongoId(clerkId);
    return this.calcStats(userId);
  }

  async getUserStatsByUsername(username: string): Promise<{ attended: number; missed: number; skipped: number; score: number }> {
    const user = await this.userModel.findOne({ username }).select('_id').exec();
    if (!user) throw new NotFoundException('User not found');
    return this.calcStats(user._id as Types.ObjectId);
  }

  private async calcStats(userId: Types.ObjectId) {
    const records = await this.attendanceModel.find({ user_id: userId }).exec();
    const attended = records.filter(r => r.status === 'attended').length;
    const missed   = records.filter(r => r.status === 'missed').length;
    const skipped  = records.filter(r => r.status === 'skipped').length;
    const total    = attended + missed;
    const score    = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { attended, missed, skipped, score };
  }

  private async recalcScore(userId: Types.ObjectId): Promise<void> {
    const stats = await this.calcStats(userId);
    await this.userModel.updateOne({ _id: userId }, { $set: { attendance_score: stats.score } }).exec();
  }
}
