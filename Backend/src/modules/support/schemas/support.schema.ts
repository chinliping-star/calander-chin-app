import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;
export type SupportChatDocument = SupportChat & Document;

// Contact-form submission (Email Us)
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user_id: Types.ObjectId | null;

  @Prop({ trim: true }) name: string;
  @Prop({ trim: true }) email: string;
  @Prop({ trim: true }) subject: string;
  @Prop({ trim: true }) message: string;

  @Prop({ default: 'open', enum: ['open', 'resolved'] })
  status: string;
}

// One stored live-support chat message
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class SupportChat {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user_id: Types.ObjectId | null;

  @Prop({ required: true }) session_id: string;

  @Prop({ enum: ['user', 'bot', 'agent'], required: true })
  from: string;

  @Prop({ trim: true }) text: string;

  @Prop({ default: false })
  needs_agent: boolean;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
export const SupportChatSchema = SchemaFactory.createForClass(SupportChat);
SupportChatSchema.index({ session_id: 1, created_at: 1 });
