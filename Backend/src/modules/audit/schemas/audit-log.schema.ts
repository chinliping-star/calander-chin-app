import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

/** One admin action — who did what, when. Append-only. */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AuditLog {
  @Prop({ default: '' })
  actor_clerk_id: string;

  @Prop({ default: '' })
  actor_username: string;

  @Prop({ default: '' })
  method: string;

  @Prop({ default: '' })
  path: string;

  @Prop({ default: 0 })
  status: number;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ created_at: -1 });
