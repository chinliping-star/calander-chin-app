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

  @Prop({ default: Date.now })
  created_at: Date;
}

export const MeetupSchema = SchemaFactory.createForClass(Meetup);
