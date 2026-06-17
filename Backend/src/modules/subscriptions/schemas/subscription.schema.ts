import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['monthly', 'yearly'], required: true })
  plan: string;

  @Prop({ enum: ['active', 'cancelled', 'expired'], default: 'active' })
  status: string;

  @Prop()
  stripe_customer_id: string;

  @Prop()
  stripe_subscription_id: string;

  @Prop()
  current_period_start: Date;

  @Prop()
  current_period_end: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ user_id: 1 });
SubscriptionSchema.index({ stripe_subscription_id: 1 });
