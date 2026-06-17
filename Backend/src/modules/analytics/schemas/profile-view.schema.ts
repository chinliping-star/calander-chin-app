import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileViewDocument = ProfileView & Document;

@Schema({ timestamps: false })
export class ProfileView {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  viewer_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  profile_id: Types.ObjectId;

  @Prop({ default: Date.now })
  viewed_at: Date;
}

export const ProfileViewSchema = SchemaFactory.createForClass(ProfileView);
ProfileViewSchema.index({ profile_id: 1, viewed_at: -1 });
ProfileViewSchema.index({ profile_id: 1, viewer_id: 1, viewed_at: -1 });
