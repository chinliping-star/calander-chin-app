import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

export type ActivityType =
  | 'meetup_accepted'
  | 'friend_added'
  | 'community_joined'
  | 'community_created'
  | 'post_created';

@Schema({ timestamps: false })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actor_id: Types.ObjectId;

  @Prop({
    enum: ['meetup_accepted', 'friend_added', 'community_joined', 'community_created', 'post_created'],
    required: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId, refPath: 'ref_model' })
  ref_id: Types.ObjectId;

  @Prop({ enum: ['Meetup', 'Community', 'Post', 'User'], required: true })
  ref_model: string;

  @Prop({ type: Object })
  meta: Record<string, unknown>;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ actor_id: 1, created_at: -1 });
ActivitySchema.index({ created_at: -1 });
