import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Conversation {
  @Prop({ enum: ['private', 'group'], default: 'private' })
  type: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ trim: true })
  name: string; // group only

  @Prop()
  avatar_url: string; // group only

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner_id: Types.ObjectId; // group only

  @Prop({
    type: {
      content: String,
      sender_id: { type: Types.ObjectId, ref: 'User' },
      sent_at: Date,
    },
    default: null,
  })
  last_message: {
    content: string;
    sender_id: Types.ObjectId;
    sent_at: Date;
  } | null;

  @Prop({ default: Date.now })
  created_at: Date;

  /** Sorted "id_id" of the two participants — private conversations only. Enforces one conversation per pair even under concurrent create requests. */
  @Prop()
  pair_key?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ pair_key: 1 }, { unique: true, sparse: true });
