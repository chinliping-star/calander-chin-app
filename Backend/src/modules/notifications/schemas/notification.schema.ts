import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'meetup_proposed'
  | 'meetup_accepted'
  | 'meetup_declined'
  | 'community_invite'
  | 'community_post'
  | 'message_received';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actor_id: Types.ObjectId;

  @Prop({ required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  body: string;

  @Prop({ type: Types.ObjectId })
  ref_id: Types.ObjectId;

  @Prop({ default: '' })
  ref_model: string;

  @Prop({ default: false })
  is_read: boolean;

  created_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
