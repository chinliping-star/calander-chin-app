import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityPostDocument = CommunityPost & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class CommunityPost {
  @Prop({ type: Types.ObjectId, ref: 'Community', required: true })
  community_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ enum: ['post', 'announcement', 'event'], default: 'post' })
  type: string;

  @Prop({ trim: true, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  content: string;

  @Prop()
  image_url: string;

  @Prop()
  event_date: Date;

  @Prop({ trim: true })
  event_location: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const CommunityPostSchema = SchemaFactory.createForClass(CommunityPost);
CommunityPostSchema.index({ community_id: 1, created_at: -1 });
