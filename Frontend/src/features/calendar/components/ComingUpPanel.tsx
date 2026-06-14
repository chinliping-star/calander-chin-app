import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from '../../../components/ui/Icon.tsx';
import type { MeetupRequest } from '../../../types/index.ts';

interface UpcomingEvent {
  id: string;
  day: string;
  title: string;
  description: string;
}

const BADGE_COLORS = [
  'var(--color-primary)',       // pink
  'var(--color-secondary)',     // dark plum
  'var(--color-primary)',       // pink
  '#c084fc',                   // purple (pending accent)
  'var(--color-secondary)',     // dark plum
];

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: '1', day: '14', title: "Valentine's",    description: 'All day celebration' },
  { id: '2', day: '17', title: 'CNY Day 1',      description: 'Family reunion' },
  { id: '3', day: '20', title: 'Movie Marathon',  description: 'Starts at 7 PM' },
  { id: '4', day: '22', title: "Tom's Gig",       description: 'Live at The Lounge' },
  { id: '5', day: '28', title: 'End of Feb Party', description: 'Rooftop vibes' },
];

const INITIAL_REQUESTS: MeetupRequest[] = [
  {
    id: 'r1',
    proposer: {
      id: '1',
      displayName: 'Mia',
      username: '@mia.bloom',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    },
    title: 'Bubble tea run? 🧋',
    date: 'Feb 20',
    status: 'pending',
  },
  {
    id: 'r2',
    proposer: {
      id: '3',
      displayName: 'Jake',
      username: '@jakegames',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    title: 'Game night at mine! 🎮',
    date: 'Feb 22',
    status: 'pending',
  },
];

const CARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
};

export function ComingUpPanel() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MeetupRequest[]>(INITIAL_REQUESTS);

  function handleAccept(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r)),
    );
  }

  function handleDecline(id: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r)),
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');

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
        <ol className="flex flex-col gap-3" aria-label="Upcoming events list">
          {UPCOMING_EVENTS.map((event, i) => (
            <li key={event.id} className="flex items-center gap-3">
              {/* Day badge — alternates between primary/secondary/purple */}
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                style={{ backgroundColor: BADGE_COLORS[i % BADGE_COLORS.length] }}
                aria-hidden="true"
              >
                {event.day}
              </span>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: 'var(--text-h)' }}
                >
                  {event.title}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: 'var(--text)' }}
                >
                  {event.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
                key={req.id}
                className="flex flex-col gap-3 rounded-xl p-3"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Proposer + quote */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={req.proposer.avatarUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    width={40}
                    height={40}
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-bold truncate"
                      style={{ color: 'var(--text-h)' }}
                    >
                      {req.proposer.displayName}
                    </p>
                    <p
                      className="text-[11px] italic truncate"
                      style={{ color: 'var(--text-h)' }}
                    >
                      "{req.title}"
                    </p>
                  </div>
                </div>

                {/* Date */}
                <p
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--text)' }}
                >
                  <span aria-hidden="true">📅</span>
                  {req.date}
                </p>

                {/* Action buttons */}
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label={`Respond to ${req.proposer.displayName}'s request`}
                >
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id)}
                    className="flex-1 rounded-full py-1.5 text-[11px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    aria-label={`Accept ${req.proposer.displayName}'s meetup: ${req.title}`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(req.id)}
                    className="flex-1 rounded-full border py-1.5 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      borderColor: 'var(--color-secondary)',
                      color: 'var(--color-secondary)',
                      backgroundColor: 'var(--bg)',
                    }}
                    aria-label={`Decline ${req.proposer.displayName}'s meetup: ${req.title}`}
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
