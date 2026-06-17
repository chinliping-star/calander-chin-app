import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityMemberDocument = CommunityMember & Document;

@Schema({ timestamps: false })
export class CommunityMember {
  @Prop({ type: Types.ObjectId, ref: 'Community', required: true })
  community_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['owner', 'moderator', 'member'], default: 'member' })
  role: string;

  @Prop({ default: Date.now })
  joined_at: Date;
}

export const CommunityMemberSchema = SchemaFactory.createForClass(CommunityMember);
CommunityMemberSchema.index({ community_id: 1, user_id: 1 }, { unique: true });
CommunityMemberSchema.index({ user_id: 1 });
