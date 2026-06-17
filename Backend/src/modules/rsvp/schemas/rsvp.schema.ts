import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RsvpDocument = Rsvp & Document;

@Schema({ timestamps: false })
export class Rsvp {
  @Prop({ type: Types.ObjectId, ref: 'CommunityPost', required: true })
  event_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['going', 'interested', 'not_going'], required: true })
  status: string;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const RsvpSchema = SchemaFactory.createForClass(Rsvp);
RsvpSchema.index({ event_id: 1, user_id: 1 }, { unique: true });
RsvpSchema.index({ event_id: 1, status: 1 });
