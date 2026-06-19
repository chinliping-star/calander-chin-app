import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShoutboxMessageDocument = ShoutboxMessage & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class ShoutboxMessage {
  /** User who wrote the shout. Broadcast to this user's friends. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author_id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 150 })
  body: string;

  @Prop({ default: false })
  pinned: boolean;

  @Prop()
  created_at: Date;
}

export const ShoutboxMessageSchema = SchemaFactory.createForClass(ShoutboxMessage);
ShoutboxMessageSchema.index({ author_id: 1, created_at: -1 });
