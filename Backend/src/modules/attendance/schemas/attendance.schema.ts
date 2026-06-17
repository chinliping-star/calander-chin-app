import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: false })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Meetup', required: true })
  meetup_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['attended', 'missed', 'skipped', 'cancelled', 'host_cancelled'], required: true })
  status: string;

  @Prop({ default: Date.now })
  marked_at: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ meetup_id: 1, user_id: 1 }, { unique: true });
AttendanceSchema.index({ user_id: 1, marked_at: -1 });
