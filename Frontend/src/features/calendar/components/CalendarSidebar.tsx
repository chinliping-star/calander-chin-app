import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { UserPlus } from '../../../components/ui/Icon.tsx';
import { useAuthStore } from '../../../store/auth.ts';
import { useFriendsApi } from '../../friends/api/friends.api.ts';
import { useMeetupsApi } from '../../meetup/api/meetups.api.ts';
import { Shoutbox } from '../../friends/components/Shoutbox.tsx';
import { themeColor } from '../../../lib/theme.ts';

const CARD_STYLE: CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
};

export function CalendarSidebar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const displayName = user?.display_name || user?.username || 'You';
  const username = user?.username || '';
  const avatarUrl = user?.avatar_url || `https://i.pravatar.cc/150?u=${username}`;

  const friendsApi = useFriendsApi();
  const meetupsApi = useMeetupsApi();

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.getFriends(),
    staleTime: 60_000,
    enabled: !!user,
  });

  const { data: meetups = [] } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    staleTime: 60_000,
    enabled: !!user,
  });

  const acceptedMeetups = meetups.filter(m => m.status === 'accepted').length;

  return (
    <aside
      className="flex w-full shrink-0 flex-col gap-4 lg:w-60"
      aria-label="Profile and friends sidebar"
    >
      {/* Profile card */}
      <div
        className="flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
        style={CARD_STYLE}
      >
        <div
          className="rounded-full"
          style={{ background: 'var(--color-primary)', padding: '3px' }}
        >
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-16 w-16 rounded-full object-cover block"
            width={64}
            height={64}
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-h)' }}>
            {displayName}
          </p>
          <p className="text-xs" style={{ color: 'var(--text)' }}>
            @{username}
          </p>
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
          {[
            { label: 'Friends',  value: friends.length },
            { label: 'Meetups',  value: acceptedMeetups },
            { label: 'Photos',   value: 0 },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5"
              style={i === 1 ? { borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' } : {}}
            >
              <span className="text-sm font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                {stat.value}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-full rounded-full py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--btn-inverted-bg, var(--color-secondary))' }}
        >
          ✏️ Edit Profile
        </button>
      </div>

      {/* Friends list card */}
      <div className="flex flex-col gap-3 rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
            Friends 💗
          </h2>
          <Link
            to="/friends"
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            <UserPlus size={12} />
            + Add
          </Link>
        </div>

        {friends.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>
            No friends yet — add some!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.slice(0, 5).map(f => (
              <Link
                key={f.friendship_id}
                to={`/${f.friend.username}`}
                className="flex items-center gap-2 rounded-xl px-1 py-0.5 transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                style={{ textDecoration: 'none' }}
              >
                <span
                  className="rounded-full shrink-0 block"
                  style={{ background: themeColor(f.friend.theme), padding: '2px' }}
                  title={`${f.friend.display_name}'s theme`}
                >
                  <img
                    src={f.friend.avatar_url || `https://i.pravatar.cc/150?u=${f.friend.username}`}
                    alt={f.friend.display_name}
                    className="h-7 w-7 rounded-full object-cover block"
                    width={28} height={28}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                    {f.friend.display_name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text)' }}>
                    @{f.friend.username}
                  </p>
                </div>
              </Link>
            ))}
            {friends.length > 5 && (
              <Link to="/friends" className="text-xs font-medium text-center" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                +{friends.length - 5} more
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Shoutbox — docked card */}
      <section
        className="rounded-2xl p-5"
        style={CARD_STYLE}
        aria-labelledby="sidebar-shoutbox-heading"
      >
        <h2
          id="sidebar-shoutbox-heading"
          className="mb-3 flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: 'var(--text-h)' }}
        >
          <MessageCircle size={14} style={{ color: 'var(--color-primary)' }} />
          Shoutbox
        </h2>
        <Shoutbox hideHeading />
      </section>

      {/* Propose meetup CTA */}
      <button
        type="button"
        onClick={() => navigate('/meetups/propose')}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: 'transparent',
          border: '2px solid var(--color-primary)',
          color: 'var(--color-primary)',
        }}
      >
        🎉 Propose Meetup
      </button>
    </aside>
  );
}
