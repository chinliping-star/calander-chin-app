import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PrivateShoutDocument = PrivateShout & Document;

/**
 * One-to-one shout between exactly two friends.
 * `pair_key` is both user ids sorted and joined with "_", so the same two
 * people always share one thread no matter who writes first.
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class PrivateShout {
  @Prop({ required: true })
  pair_key: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 150 })
  body: string;

  @Prop()
  created_at: Date;
}

export const PrivateShoutSchema = SchemaFactory.createForClass(PrivateShout);
PrivateShoutSchema.index({ pair_key: 1, created_at: -1 });
