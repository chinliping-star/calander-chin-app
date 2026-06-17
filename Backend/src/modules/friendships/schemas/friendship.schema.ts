import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FriendshipDocument = Friendship & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Friendship {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient_id: Types.ObjectId;

  @Prop({ enum: ['pending', 'accepted', 'blocked', 'removed'], default: 'pending' })
  status: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// Index for efficient lookups
FriendshipSchema.index({ requester_id: 1, recipient_id: 1 }, { unique: true });
FriendshipSchema.index({ recipient_id: 1, status: 1 });
