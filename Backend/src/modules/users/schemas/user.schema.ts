import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  clerk_id: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  display_name: string;

  @Prop({ trim: true })
  first_name: string;

  @Prop({ trim: true })
  last_name: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  heard_about: string;

  @Prop({ trim: true })
  country: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [String], default: [] })
  hobbies: string[];

  @Prop({ trim: true })
  bio: string;

  @Prop()
  banner_url: string;

  @Prop()
  avatar_url: string;

  @Prop({ default: 'pastel-pink' })
  theme: string;

  /**
   * Privacy toggles. Missing field (older accounts) = defaults below, which
   * mirror the app's original all-public behaviour.
   */
  @Prop({
    type: {
      private_account: { type: Boolean, default: false }, // true → calendar + meetups friends-only
      friend_requests: { type: Boolean, default: true },  // false → nobody can send requests
      discoverability: { type: Boolean, default: true },  // false → hidden from search
      show_meetups: { type: Boolean, default: true },     // false → meetup history hidden from profile
      // What a FRIEND sees of the friend list: mutual friends only, or all.
      // Strangers never see the friend list. Owner always sees everything.
      friend_list: { type: String, enum: ['mutual', 'all'], default: 'mutual' },
    },
    _id: false,
    default: () => ({}),
  })
  privacy: {
    private_account?: boolean;
    friend_requests?: boolean;
    discoverability?: boolean;
    show_meetups?: boolean;
    friend_list?: 'mutual' | 'all';
  };

  @Prop({ default: false })
  is_premium: boolean;

  @Prop({ default: false })
  is_admin: boolean;

  /** Moderation status (admin panel). active = normal. */
  @Prop({ enum: ['active', 'suspended', 'blocked'], default: 'active' })
  status: string;

  /** When a suspension expires (null = not suspended / permanent block). */
  @Prop({ default: null })
  suspended_until: Date | null;

  /** Reason for the current suspension/block (admin note). */
  @Prop({ default: '' })
  moderation_reason: string;

  /** Display role for admin panel — access control itself is via env allowlist. */
  @Prop({ enum: ['user', 'moderator', 'admin'], default: 'user' })
  role: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: null })
  deleted_at: Date | null;

  @Prop({ default: '' })
  deletion_reason: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
