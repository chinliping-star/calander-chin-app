import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarDayDocument = CalendarDay & Document;

@Schema()
export class CalendarDay {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ enum: ['available', 'blocked'], default: 'available' })
  status: string;

  @Prop({ type: [String], default: [] })
  stickers: string[];
}

export const CalendarDaySchema = SchemaFactory.createForClass(CalendarDay);

// Compound index to ensure one document per user per date
CalendarDaySchema.index({ user_id: 1, date: 1 }, { unique: true });
