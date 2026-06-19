import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StickyNoteDocument = StickyNote & Document;

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class StickyNote {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ default: '', trim: true, maxlength: 500 })
  body: string;

  @Prop({ enum: NOTE_COLORS, default: 'yellow' })
  color: NoteColor;

  /** Viewport position in px */
  @Prop({ default: 80 })
  x: number;

  @Prop({ default: 120 })
  y: number;

  /** Note size in px */
  @Prop({ default: 200 })
  width: number;

  @Prop({ default: 200 })
  height: number;

  /** Show/hide toggle */
  @Prop({ default: true })
  visible: boolean;

  /** Route path the note is locked to. null = show on every page. */
  @Prop({ type: String, default: null })
  pinned_path: string | null;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const StickyNoteSchema = SchemaFactory.createForClass(StickyNote);
