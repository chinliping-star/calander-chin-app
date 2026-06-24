import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'user' | 'post';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Report {
  /** Null for system/auto-generated reports. */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reporter_id: Types.ObjectId | null;

  /** True when filed automatically by the content scanner. */
  @Prop({ default: false })
  auto: boolean;

  @Prop({ enum: ['user', 'post'], required: true })
  target_type: ReportTargetType;

  /** refPath points at target_model so populate resolves the right collection. */
  @Prop({ type: Types.ObjectId, required: true, refPath: 'target_model' })
  target_id: Types.ObjectId;

  @Prop({ enum: ['User', 'Post'], required: true })
  target_model: 'User' | 'Post';

  @Prop({ enum: ['spam', 'harassment', 'inappropriate', 'impersonation', 'other'], default: 'other' })
  reason: string;

  @Prop({ trim: true, maxlength: 1000, default: '' })
  details: string;

  @Prop({ enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
  status: ReportStatus;

  /** What the moderator did when resolving (audit trail). */
  @Prop({ default: '' })
  action_taken: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolved_by: Types.ObjectId | null;

  @Prop({ default: null })
  resolved_at: Date | null;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ status: 1, created_at: -1 });
ReportSchema.index({ target_type: 1, target_id: 1 });
