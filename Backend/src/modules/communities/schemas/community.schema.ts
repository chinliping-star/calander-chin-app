import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityDocument = Community & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Community {
  @Prop({ required: true, trim: true, maxlength: 60 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true, maxlength: 500 })
  description: string;

  @Prop()
  avatar_url: string;

  @Prop()
  banner_url: string;

  @Prop({ trim: true })
  category: string;

  @Prop({ default: false })
  is_private: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ default: 0 })
  member_count: number;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
CommunitySchema.index({ slug: 1 });
CommunitySchema.index({ name: 'text', description: 'text' });
