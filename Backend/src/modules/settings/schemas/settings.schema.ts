import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

/** Single platform-wide settings document (singleton). */
@Schema({ timestamps: { createdAt: false, updatedAt: 'updated_at' } })
export class Settings {
  @Prop({ default: 'Friendiary' })
  app_name: string;

  @Prop({ default: false })
  maintenance_mode: boolean;

  @Prop({ trim: true, default: '' })
  maintenance_message: string;

  /** Arbitrary on/off feature toggles. */
  @Prop({ type: Object, default: {} })
  feature_flags: Record<string, boolean>;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
