import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, MapPin, Lock, Sparkles, Loader2, CalendarCheck } from 'lucide-react';
import { useMeetupsApi } from '../api/meetups.api.ts';
import type { ApiMeetup, ApiMeetupUser } from '../../calendar/api/calendar.api.ts';

interface Props {
  meetup: ApiMeetup;
  myId: string;
}

/**
 * One poll-style meetup proposal. Invitees vote a single slot; the proposer
 * locks a slot manually or auto-locks the top-voted one. Once locked it becomes
 * a real confirmed meetup.
 */
export function ProposalCard({ meetup, myId }: Props) {
  const api = useMeetupsApi();
  const qc = useQueryClient();

  const isProposer = meetup.proposer_id?._id === myId;
  const locked = !!meetup.locked_slot_id;
  const slots = meetup.proposed_slots ?? [];
  const votes = meetup.slot_votes ?? [];

  // Everyone can see who voted for which slot.
  const people = new Map<string, ApiMeetupUser>(
    (meetup.participants ?? []).filter(Boolean).map(p => [p._id, p]),
  );
  if (meetup.proposer_id?._id) people.set(meetup.proposer_id._id, meetup.proposer_id);
  const votersFor = (slotId: string) =>
    votes.filter(v => v.slot_id === slotId).map(v => people.get(v.user_id)).filter((u): u is ApiMeetupUser => !!u);
  const votedIds = new Set(votes.map(v => v.user_id));
  const notVoted = (meetup.participants ?? []).filter(p => p && !votedIds.has(p._id));
  const nameOf = (u: ApiMeetupUser) => (u._id === myId ? 'You' : u.display_name || u.username);

  const myVote = votes.find(v => v.user_id === myId)?.slot_id ?? null;
  const countFor = (slotId: string) => votes.filter(v => v.slot_id === slotId).length;
  const topSlotId = slots
    .map(s => ({ id: s._id, n: countFor(s._id) }))
    .sort((a, b) => b.n - a.n)[0]?.id;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['meetups'] });
    void qc.invalidateQueries({ queryKey: ['calendar'] });
  };

  const vote = useMutation({
    mutationFn: (slotId: string) => api.voteSlot(meetup._id, slotId),
    onSuccess: refresh,
  });
  const lock = useMutation({
    mutationFn: (slotId?: string) => api.lockSlot(meetup._id, slotId),
    onSuccess: refresh,
  });

  const proposerName = meetup.proposer_id?.display_name || meetup.proposer_id?.username || 'Someone';
  const inviteeCount = (meetup.participants?.length ?? 1) - 1;
  const voterCount = new Set(votes.map(v => v.user_id)).size;

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
            by <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{isProposer ? 'you' : proposerName}</span>
            {' · '}{voterCount}/{inviteeCount} voted
          </p>
        </div>
        {locked ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <CalendarCheck size={11} /> Confirmed
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            Voting open
          </span>
        )}
      </div>

      {meetup.description && (
        <p className="text-xs" style={{ color: 'var(--text)' }}>{meetup.description}</p>
      )}

      {/* Slots */}
      <div className="flex flex-col gap-2">
        {slots.map(slot => {
          const n = countFor(slot._id);
          const mine = myVote === slot._id;
          const isLockedSlot = meetup.locked_slot_id === slot._id;
          const isTop = !locked && topSlotId === slot._id && n > 0;
          return (
            <div
              key={slot._id}
              className="flex flex-col gap-2 rounded-xl px-3 py-2.5"
              style={{
                backgroundColor: isLockedSlot ? '#dcfce7' : mine ? 'var(--accent-bg)' : 'var(--color-neutral)',
                border: isLockedSlot
                  ? '1.5px solid #86efac'
                  : mine ? '1.5px solid var(--accent-border)' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-h)' }}>{slot.date}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {slot.time && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                      <Clock size={9} />{slot.time}
                    </span>
                  )}
                  {slot.location && (
                    <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'var(--text)' }}>
                      <MapPin size={9} />{slot.location}
                    </span>
                  )}
                  <span className="text-[10px] font-bold" style={{ color: isTop ? 'var(--color-primary)' : 'var(--text)' }}>
                    {n} vote{n !== 1 ? 's' : ''}{isTop ? ' · leading' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!locked && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Vote toggle (invitees + proposer can vote) */}
                  <button
                    type="button"
                    onClick={() => vote.mutate(slot._id)}
                    disabled={vote.isPending}
                    aria-pressed={mine}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={mine
                      ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                      : { backgroundColor: 'var(--bg)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary-light)' }}
                  >
                    {mine ? <Check size={11} /> : null}
                    {mine ? 'Voted' : 'Vote'}
                  </button>
                  {/* Proposer can lock this specific slot */}
                  {isProposer && (
                    <button
                      type="button"
                      onClick={() => lock.mutate(slot._id)}
                      disabled={lock.isPending}
                      title="Lock this slot"
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-dark)' }}
                    >
                      <Lock size={12} />
                    </button>
                  )}
                </div>
              )}
              {isLockedSlot && (
                <span className="flex items-center gap-1 text-[10px] font-bold shrink-0" style={{ color: '#15803d' }}>
                  <Check size={12} /> Picked
                </span>
              )}
              </div>

              {/* Who voted for this slot */}
              {n > 0 && <VoterList voters={votersFor(slot._id)} nameOf={nameOf} />}
            </div>
          );
        })}
      </div>

      {/* Who has not voted yet */}
      {!locked && notVoted.length > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--text)' }}>
          <span className="font-semibold">Not voted yet:</span> {notVoted.map(nameOf).join(', ')}
        </p>
      )}

      {/* Proposer auto-lock */}
      {isProposer && !locked && (
        <button
          type="button"
          onClick={() => lock.mutate(undefined)}
          disabled={lock.isPending || voterCount === 0}
          className="mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          {lock.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {voterCount === 0 ? 'Waiting for votes…' : 'Auto-lock top slot'}
        </button>
      )}
    </article>
  );
}

/** Small avatars + names of the people who picked a slot. */
function VoterList({ voters, nameOf }: { voters: ApiMeetupUser[]; nameOf: (u: ApiMeetupUser) => string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" aria-label="Voted by">
      <div className="flex -space-x-1.5">
        {voters.slice(0, 5).map(u => (
          <span
            key={u._id}
            title={nameOf(u)}
            className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold"
            style={{ boxShadow: '0 0 0 1.5px var(--bg)', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
          >
            {u.avatar_url
              ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              : (u.display_name || u.username || '?').charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
      <span className="text-[10px]" style={{ color: 'var(--text)' }}>
        {voters.map(nameOf).join(', ')}
      </span>
    </div>
  );
}
