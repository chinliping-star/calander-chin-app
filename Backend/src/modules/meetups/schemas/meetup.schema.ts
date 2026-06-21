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

  /**
   * Per-invitee RSVP. One entry per invited person (owner + extras, not the
   * proposer). Each responds independently — one accept does not decide for the
   * others. The top-level `status` is a derived rollup for calendar colouring.
   */
  @Prop({
    type: [
      {
        user_id: { type: Types.ObjectId, ref: 'User', required: true },
        status:  { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      },
    ],
    default: [],
  })
  responses: { user_id: Types.ObjectId; status: string }[];

  @Prop({
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: false })
  is_private: boolean;

  /** @deprecated kept for backward compat; new uploads go to memory_photos[] */
  @Prop()
  memory_photo_url: string;

  @Prop({
    type: [
      {
        url:      { type: String, required: true },
        added_by: { type: Types.ObjectId, ref: 'User', required: true },
        added_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  memory_photos: { url: string; added_by: Types.ObjectId; added_at: Date }[];

  @Prop({ default: Date.now })
  created_at: Date;
}

export const MeetupSchema = SchemaFactory.createForClass(Meetup);
