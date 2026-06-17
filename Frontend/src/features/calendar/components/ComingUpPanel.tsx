import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from '../../../components/ui/Icon.tsx';
import { useMeetupsApi } from '../../meetup/api/meetups.api.ts';
import { useAuthStore } from '../../../store/auth.ts';

const BADGE_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-primary)',
  '#c084fc',
  'var(--color-secondary)',
];

const CARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
};

export function ComingUpPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const meetupsApi = useMeetupsApi();
  const { user } = useAuthStore();

  const { data: meetups = [] } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    staleTime: 30_000,
  });

  const today = new Date().toISOString().split('T')[0];

  const upcoming = meetups
    .filter(m => m.date >= today && (m.status === 'accepted' || m.status === 'pending'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // Only show requests where current user is the RECEIVER (owner), not the proposer
  const pendingRequests = meetups.filter(m =>
    m.status === 'pending' &&
    m.date >= today &&
    m.proposer_id._id !== user?._id
  );

  const accept = useMutation({
    mutationFn: (id: string) => meetupsApi.acceptMeetup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meetups'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const decline = useMutation({
    mutationFn: (id: string) => meetupsApi.declineMeetup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meetups'] });
    },
  });

  return (
    <aside
      className="flex w-72 shrink-0 flex-col gap-4"
      aria-label="Upcoming events and meetup requests"
    >
      {/* Coming Up card */}
      <section
        className="rounded-2xl p-5"
        style={CARD_STYLE}
        aria-labelledby="coming-up-heading"
      >
        <h2
          id="coming-up-heading"
          className="mb-4 font-semibold"
          style={{ color: 'var(--text-h)', fontSize: '14px', margin: '0 0 16px' }}
        >
          Coming Up 🗓️
        </h2>

        {upcoming.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>
            Nothing planned yet — create a meetup!
          </p>
        ) : (
          <ol className="flex flex-col gap-3" aria-label="Upcoming events list">
            {upcoming.map((m, i) => {
              const day = parseInt(m.date.split('-')[2], 10);
              return (
                <li key={m._id} className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: BADGE_COLORS[i % BADGE_COLORS.length] }}
                    aria-hidden="true"
                  >
                    {day}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                      {m.title}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text)' }}>
                      {m.time ? `${m.time}` : m.date}
                      {m.location ? ` · ${m.location}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Requests card */}
      <section
        className="rounded-2xl p-5"
        style={CARD_STYLE}
        aria-labelledby="requests-heading"
      >
        <div className="mb-4 flex items-center gap-2">
          <h2
            id="requests-heading"
            className="font-semibold"
            style={{ color: 'var(--text-h)', fontSize: '14px', margin: 0 }}
          >
            Requests
          </h2>
          <Bell size={14} className="opacity-60" />
          {pendingRequests.length > 0 && (
            <span
              className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label={`${pendingRequests.length} pending requests`}
            >
              {pendingRequests.length}
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <p className="py-4 text-center text-xs" style={{ color: 'var(--text)' }}>
            No pending requests 🎉
          </p>
        ) : (
          <ul className="flex flex-col gap-3" role="list">
            {pendingRequests.map((req) => (
              <li
                key={req._id}
                className="flex flex-col gap-3 rounded-xl p-3"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={req.proposer_id.avatar_url || `https://i.pravatar.cc/150?u=${req.proposer_id.username}`}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    width={40} height={40}
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-h)' }}>
                      {req.proposer_id.display_name}
                    </p>
                    <p className="text-[11px] italic truncate" style={{ color: 'var(--text-h)' }}>
                      "{req.title}"
                    </p>
                  </div>
                </div>

                <p className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                  <span aria-hidden="true">📅</span>
                  {req.date}{req.time ? ` · ${req.time}` : ''}
                </p>

                <div className="flex gap-2" role="group" aria-label={`Respond to ${req.proposer_id.display_name}'s request`}>
                  <button
                    type="button"
                    onClick={() => accept.mutate(req._id)}
                    disabled={accept.isPending}
                    className="flex-1 rounded-full py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => decline.mutate(req._id)}
                    disabled={decline.isPending}
                    className="flex-1 rounded-full border py-1.5 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                    style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)', backgroundColor: 'var(--bg)' }}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* New meetup CTA */}
      <button
        type="button"
        onClick={() => navigate('/meetups/new')}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label="Create a new meetup"
      >
        + New Meetup
      </button>
    </aside>
  );
}
