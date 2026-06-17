import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rsvp, RsvpDocument } from './schemas/rsvp.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class RsvpService {
  constructor(
    @InjectModel(Rsvp.name) private readonly rsvpModel: Model<RsvpDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private async resolveMongoId(clerkId: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ clerk_id: clerkId }).select('_id').exec();
    if (!user) throw new NotFoundException('User not found');
    return user._id as Types.ObjectId;
  }

  async upsert(clerkId: string, eventId: string, status: 'going' | 'interested' | 'not_going'): Promise<RsvpDocument> {
    const userId = await this.resolveMongoId(clerkId);
    return this.rsvpModel.findOneAndUpdate(
      { event_id: new Types.ObjectId(eventId), user_id: userId },
      { $set: { status, updated_at: new Date() } },
      { upsert: true, new: true },
    ).populate('user_id', 'username display_name avatar_url').exec() as Promise<RsvpDocument>;
  }

  async remove(clerkId: string, eventId: string): Promise<void> {
    const userId = await this.resolveMongoId(clerkId);
    await this.rsvpModel.findOneAndDelete({
      event_id: new Types.ObjectId(eventId),
      user_id: userId,
    }).exec();
  }

  async getForEvent(eventId: string): Promise<{
    going: RsvpDocument[];
    interested: RsvpDocument[];
    not_going: RsvpDocument[];
    counts: Record<string, number>;
  }> {
    const all = await this.rsvpModel
      .find({ event_id: new Types.ObjectId(eventId) })
      .populate('user_id', 'username display_name avatar_url')
      .exec();

    const going      = all.filter(r => r.status === 'going');
    const interested = all.filter(r => r.status === 'interested');
    const not_going  = all.filter(r => r.status === 'not_going');

    return {
      going,
      interested,
      not_going,
      counts: { going: going.length, interested: interested.length, not_going: not_going.length },
    };
  }

  async getMyRsvp(clerkId: string, eventId: string): Promise<RsvpDocument | null> {
    const userId = await this.resolveMongoId(clerkId);
    return this.rsvpModel.findOne({ event_id: new Types.ObjectId(eventId), user_id: userId }).exec();
  }
}
