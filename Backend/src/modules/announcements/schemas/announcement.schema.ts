import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Announcement {
  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  body: string;

  @Prop({ enum: ['low', 'normal', 'high'], default: 'normal' })
  priority: string;

  /** Who sees it. */
  @Prop({ enum: ['all', 'premium', 'admins'], default: 'all' })
  audience: string;

  @Prop({ default: false })
  is_pinned: boolean;

  /** Scheduled publish time — hidden until this passes. */
  @Prop({ default: Date.now })
  publish_at: Date;

  /** Auto-hide after this time (null = never). */
  @Prop({ default: null })
  expires_at: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  created_by: Types.ObjectId | null;

  /** Users who dismissed it (so it won't show again for them). */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  dismissed_by: Types.ObjectId[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ publish_at: -1 });
