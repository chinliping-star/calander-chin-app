import type { ApiMeetup } from '../calendar/api/calendar.api.ts';

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Poll still taking votes: not locked, not cancelled, and at least one slot not in the past. */
export function isOpenProposal(m: ApiMeetup, today = todayStr()): boolean {
  return (
    !!m.is_proposal &&
    !m.locked_slot_id &&
    m.status !== 'cancelled' &&
    (m.proposed_slots ?? []).some(s => s.date >= today)
  );
}

/**
 * Poll whose time was locked and is still ahead. Locking turns it into a normal
 * meetup (is_proposal becomes false), so it is found by locked_slot_id.
 */
export function isConfirmedProposal(m: ApiMeetup, today = todayStr()): boolean {
  return !!m.locked_slot_id && m.status !== 'cancelled' && m.date >= today;
}

/** Invite waiting for MY answer (not one I sent, not a poll). Feeds the Invites list and badge. */
export function isMyPendingInvite(m: ApiMeetup, myId: string | undefined): boolean {
  return (
    !m.is_proposal &&
    m.proposer_id?._id !== myId &&
    m.responses?.find(r => r.user_id?._id === myId)?.status === 'pending'
  );
}
