import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoinTransactionDocument = CoinTransaction & Document;

export const COIN_REASONS = [
  'friend_added',   // earned: a friend request was accepted (both people)
  'post_created',   // earned: diary post
  'post_photo',     // earned: diary post with a picture
  'memory_photo',   // earned: photo added to a meetup memory
  'redeem_premium', // spent: coins → premium days
  'admin_adjust',   // admin grant / deduction
] as const;
export type CoinReason = (typeof COIN_REASONS)[number];

/** One row per coin movement. `amount` is + for earned, - for spent. */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class CoinTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: COIN_REASONS, required: true })
  reason: CoinReason;

  /** What earned it (post id, friend pair…). Unique per user+reason so the
   * same thing can never pay twice. */
  @Prop()
  ref?: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const CoinTransactionSchema = SchemaFactory.createForClass(CoinTransaction);
CoinTransactionSchema.index(
  { user_id: 1, reason: 1, ref: 1 },
  { unique: true, partialFilterExpression: { ref: { $type: 'string' } } },
);
CoinTransactionSchema.index({ user_id: 1, created_at: -1 });
