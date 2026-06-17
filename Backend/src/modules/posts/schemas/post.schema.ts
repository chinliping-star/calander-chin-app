import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ enum: ['text', 'image', 'event_memory', 'meetup_story'], default: 'text' })
  type: string;

  @Prop({ trim: true, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  content: string;

  @Prop()
  image_url: string;

  @Prop()
  image_public_id: string;

  @Prop({ enum: ['public', 'friends', 'private'], default: 'friends' })
  privacy: string;

  @Prop({ type: Types.ObjectId, ref: 'Meetup' })
  meetup_ref: Types.ObjectId;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ author_id: 1, created_at: -1 });
PostSchema.index({ author_id: 1, privacy: 1, created_at: -1 });
