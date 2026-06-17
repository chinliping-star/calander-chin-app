import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetupDocument = Meetup & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Meetup {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  proposer_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  time: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  location: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants: Types.ObjectId[];

  @Prop({
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: false })
  is_private: boolean;

  @Prop()
  memory_photo_url: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const MeetupSchema = SchemaFactory.createForClass(Meetup);
