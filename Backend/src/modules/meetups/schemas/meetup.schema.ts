import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetupDocument = Meetup & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Meetup {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  proposer_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  time: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  location: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants: Types.ObjectId[];

  /**
   * Per-invitee RSVP. One entry per invited person (owner + extras, not the
   * proposer). Each responds independently — one accept does not decide for the
   * others. The top-level `status` is a derived rollup for calendar colouring.
   */
  @Prop({
    type: [
      {
        user_id: { type: Types.ObjectId, ref: 'User', required: true },
        status:  { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      },
    ],
    default: [],
  })
  responses: { user_id: Types.ObjectId; status: string }[];

  @Prop({
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  })
  status: string;

  // ── Proposal / voting (poll-style meetups) ─────────────────────────────────
  /** When true this is a poll: invitees vote a slot before it becomes a real
   * meetup. The top-level date/time/location are filled in once a slot locks. */
  @Prop({ default: false })
  is_proposal: boolean;

  /** Candidate time slots invitees choose between. */
  @Prop({
    type: [
      {
        date:     { type: String, required: true }, // YYYY-MM-DD
        time:     { type: String, default: '' },
        location: { type: String, default: '' },
      },
    ],
    default: [],
  })
  proposed_slots: { _id: Types.ObjectId; date: string; time: string; location: string }[];

  /** One vote per invitee (single-select). Re-voting moves the user's vote. */
  @Prop({
    type: [
      {
        slot_id: { type: Types.ObjectId, required: true },
        user_id: { type: Types.ObjectId, ref: 'User', required: true },
      },
    ],
    default: [],
  })
  slot_votes: { slot_id: Types.ObjectId; user_id: Types.ObjectId }[];

  /** Set once the proposer (or auto-pick) locks a winning slot. */
  @Prop({ type: Types.ObjectId, default: null })
  locked_slot_id: Types.ObjectId | null;

  @Prop({ default: false })
  is_private: boolean;

  /** @deprecated kept for backward compat; new uploads go to memory_photos[] */
  @Prop()
  memory_photo_url: string;

  @Prop({
    type: [
      {
        url:      { type: String, required: true },
        added_by: { type: Types.ObjectId, ref: 'User', required: true },
        added_at: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  memory_photos: { url: string; added_by: Types.ObjectId; added_at: Date }[];

  /** Who may add memory photos. 'everyone' = all participants (default);
   * 'selected' = only the creator (proposer) + memory_uploaders. */
  @Prop({ enum: ['everyone', 'selected'], default: 'everyone' })
  memory_upload_mode: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  memory_uploaders: Types.ObjectId[];

  /** People who archived this memory. Archive is personal: it hides the
   * memory only for that person. Never sent to clients as-is. */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [], select: false })
  memory_archived_by: Types.ObjectId[];

  /** Personal chip colour per person on their calendar. Each user sees only
   * their own pick (sent back as `my_color`). Never sent to clients as-is. */
  @Prop({
    type: [{ user_id: { type: Types.ObjectId, ref: 'User', required: true }, color: { type: String, required: true } }],
    _id: false,
    default: [],
    select: false,
  })
  event_colors: { user_id: Types.ObjectId; color: string }[];

  @Prop({ default: Date.now })
  created_at: Date;
}

export const MeetupSchema = SchemaFactory.createForClass(Meetup);
