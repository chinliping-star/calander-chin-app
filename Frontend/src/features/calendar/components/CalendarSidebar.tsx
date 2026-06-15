import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from '../../../components/ui/Icon.tsx';
import type { Friend } from '../../../types/index.ts';

const CURRENT_USER = {
  displayName: 'Chin',
  username: '@chin.star',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  friends: 8,
  meetups: 14,
  photos: 26,
};

const FRIENDS: Friend[] = [
  { id: '1', displayName: 'Mia', username: '@mia.bloom', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: '2', displayName: 'Sara', username: '@sara.fly', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
  { id: '3', displayName: 'Jake', username: '@jakegames', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
  { id: '4', displayName: 'Lily', username: '@lily.garden', avatarUrl: 'https://i.pravatar.cc/150?img=20' },
  { id: '5', displayName: 'Tom', username: '@tom.beats', avatarUrl: 'https://i.pravatar.cc/150?img=15' },
];

const CARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
};

export function CalendarSidebar() {
  const navigate = useNavigate();
  return (
    <aside
      className="flex w-60 shrink-0 flex-col gap-4"
      aria-label="Profile and friends sidebar"
    >
      {/* Profile card */}
      <div
        className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
        style={CARD_STYLE}
      >
        {/* Avatar with pink ring */}
        <div
          className="rounded-full p-0.5"
          style={{ background: 'var(--color-primary)', padding: '3px' }}
        >
          <img
            src={CURRENT_USER.avatarUrl}
            alt={CURRENT_USER.displayName}
            className="h-16 w-16 rounded-full object-cover block"
            width={64}
            height={64}
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p
            className="text-sm font-bold leading-tight"
            style={{ color: 'var(--text-h)' }}
          >
            {CURRENT_USER.displayName}
          </p>
          <p className="text-xs" style={{ color: 'var(--text)' }}>
            {CURRENT_USER.username}
          </p>
          {/* Purple badge */}
          <span
            className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
          >
            ✦ cutie planner
          </span>
        </div>

        {/* Stats row */}
        <div
          className="w-full grid grid-cols-3 gap-1 rounded-xl py-2.5 px-1"
          style={{ backgroundColor: 'var(--color-neutral)' }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
              {CURRENT_USER.friends}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
              Friends
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5" style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
              {CURRENT_USER.meetups}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
              Meetups
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
              {CURRENT_USER.photos}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
              Photos
            </span>
          </div>
        </div>

        {/* Edit profile button — inverted (secondary dark) */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-full rounded-full py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--btn-inverted-bg)' }}
        >
          ✏️ Edit Profile
        </button>
      </div>

      {/* Friends list card */}
      <div
        className="flex flex-col gap-3 rounded-2xl p-5"
        style={CARD_STYLE}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
            Friends 💗
          </h2>
          <Link
            to="/friends"
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
            aria-label="Add a friend"
          >
            <UserPlus size={12} />
            + Add
          </Link>
        </div>

        <ul className="flex flex-col gap-2" role="list">
          {FRIENDS.map((friend) => (
            <li key={friend.id}>
              <Link
                to={`/${friend.username.replace('@', '')}`}
                className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                style={{ textDecoration: 'none' }}
              >
                {/* Avatar with green online dot */}
                <div className="relative shrink-0">
                  <img
                    src={friend.avatarUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-9 w-9 rounded-full object-cover"
                    width={36}
                    height={36}
                    loading="lazy"
                  />
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: '#22c55e' }}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-xs font-semibold"
                    style={{ color: 'var(--text-h)' }}
                  >
                    {friend.displayName}
                  </p>
                  <p
                    className="truncate text-[10px]"
                    style={{ color: 'var(--text)' }}
                  >
                    {friend.username}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Propose meetup CTA — outlined */}
      <button
        type="button"
        onClick={() => navigate('/meetups/propose')}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: 'transparent',
          border: '2px solid var(--color-primary)',
          color: 'var(--color-primary)',
        }}
        aria-label="Propose a meetup"
      >
        🎉 Propose Meetup
      </button>
    </aside>
  );
}
