import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar, CalendarPlus, Users, Mail, Ban, Clock, CalendarHeart,
} from 'lucide-react';
import type { Conversation } from '../types';
import { useAuthStore } from '../../../store/auth';
import { getPeer } from '../utils';
import { PresenceDot } from './PresenceDot';
import { useFriendsApi } from '../../friends/api/friends.api';
import { useMeetupsApi } from '../../meetup/api/meetups.api';

interface Props {
  conversation: Conversation;
  onlineUsers: Set<string>;
}

/** Format meetup date+time safely; falls back to date-only if time is malformed. */
function formatEventWhen(date: string, time?: string): string {
  const withTime = new Date(`${date}T${time || '00:00'}`);
  if (time && !Number.isNaN(withTime.getTime())) {
    return format(withTime, 'EEE, MMM d, h:mm a');
  }
  const dateOnly = new Date(`${date}T00:00`);
  return Number.isNaN(dateOnly.getTime()) ? date : format(dateOnly, 'EEE, MMM d');
}

export function ChatDetailsPanel({ conversation, onlineUsers }: Props) {
  const me = useAuthStore(s => s.user);
  const friendsApi = useFriendsApi();
  const meetupsApi = useMeetupsApi();

  const isGroup = conversation.type === 'group';
  const peer = getPeer(conversation, me);
  const name = isGroup ? (conversation.name ?? 'Group Chat') : (peer?.display_name ?? peer?.username ?? 'Unknown');
  const avatar = isGroup ? conversation.avatar_url : peer?.avatar_url;
  const online = !!peer && onlineUsers.has(peer._id);

  // Real: mutual friends with this peer
  const { data: mutual } = useQuery({
    queryKey: ['mutual-friends', peer?._id],
    queryFn: () => friendsApi.getMutual(peer!._id),
    enabled: !!peer?._id,
  });

  // Real: upcoming meetups shared with this peer
  const { data: meetups = [] } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    enabled: !!peer?._id,
  });

  const sharedEvents = useMemo(() => {
    if (!peer) return [];
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return meetups
      .filter(m => m.status === 'accepted' || m.status === 'pending')
      .filter(m => m.date >= today)
      .filter(m =>
        m.owner_id?._id === peer._id ||
        m.proposer_id?._id === peer._id ||
        m.participants?.some(p => p._id === peer._id))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 3);
  }, [meetups, peer]);

  const memberSince = peer?.created_at ? format(new Date(peer.created_at), 'MMM yyyy') : null;

  return (
    <aside
      className="hidden lg:flex w-80 flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden"
      style={{ borderLeft: '1px solid var(--border)', background: 'var(--color-neutral)' }}
      aria-label="Conversation details"
    >
      <div className="px-6 py-5 text-center">
        <h2 className="text-base font-bold" style={{ color: 'var(--text-h)' }}>Details</h2>
      </div>

      {/* Identity */}
      <div className="px-6 flex flex-col items-center text-center">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold overflow-hidden"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {avatar
              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
              : name.charAt(0).toUpperCase()}
          </div>
          {!isGroup && (
            <span className="absolute bottom-1.5 right-1.5">
              <PresenceDot online={online} size={16} ringColor="var(--color-neutral)" />
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold" style={{ color: 'var(--text-h)' }}>{name}</h3>

        {isGroup ? (
          <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--text)' }}>
            <Users size={12} /> {conversation.participants.length} members
          </p>
        ) : (
          <p className="mt-1 text-xs" style={{ color: online ? '#16a34a' : 'var(--text)' }}>
            {online ? '● Online' : 'Offline'}
            {peer?.username && <span style={{ color: 'var(--text)' }}> · @{peer.username}</span>}
          </p>
        )}
      </div>

      {!isGroup && peer && (
        <>
          {/* Secondary actions */}
          <div className="px-6 mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            >
              <Mail size={15} strokeWidth={1.5} /> Archive
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            >
              <Ban size={15} strokeWidth={1.5} /> Block
            </button>
          </div>

          {/* Primary actions */}
          <div className="px-6 mt-3 flex flex-col gap-2.5">
            <Link
              to="/meetups/propose"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <CalendarPlus size={16} strokeWidth={1.5} /> Invite to Event
            </Link>
            <Link
              to={`/${peer.username}/calendar`}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors hover:opacity-90"
              style={{ border: '1px solid var(--border)', color: 'var(--text-h)', background: 'var(--bg)' }}
            >
              <Calendar size={16} strokeWidth={1.5} /> View Calendar
            </Link>
          </div>

          {/* Upcoming shared events (real) */}
          <div className="px-6 mt-6">
            <div className="mb-3">
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>Upcoming Shared Events</h4>
            </div>
            {sharedEvents.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text)' }}>No upcoming shared events.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sharedEvents.map(ev => (
                  <Link
                    key={ev._id}
                    to="/meetups/new"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--bg)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                    >
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{ev.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                        {formatEventWhen(ev.date, ev.time)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mutual friends (real) */}
          <div className="px-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>Mutual Friends</h4>
              {!!mutual?.total && (
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {mutual.total} Total
                </span>
              )}
            </div>
            {!mutual || mutual.total === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text)' }}>No mutual friends yet.</p>
            ) : (
              <div className="flex items-center -space-x-2">
                {mutual.friends.slice(0, 4).map(f => (
                  <Link
                    key={f._id}
                    to={`/${f.username}`}
                    title={f.display_name}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', boxShadow: '0 0 0 2px var(--color-neutral)' }}
                  >
                    {f.avatar_url
                      ? <img src={f.avatar_url} alt={f.display_name} className="w-full h-full object-cover" />
                      : f.display_name.charAt(0).toUpperCase()}
                  </Link>
                ))}
                {mutual.total > 4 && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--color-primary)', boxShadow: '0 0 0 2px var(--color-neutral)' }}
                  >
                    +{mutual.total - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer (real) */}
          {memberSince && (
            <div className="px-6 mt-6 mb-6 pt-4 flex items-center gap-1.5 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
              <Clock size={12} /> Member since {memberSince}
            </div>
          )}
        </>
      )}

      {isGroup && (
        <div className="px-6 mt-6 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
          <CalendarHeart size={12} /> Group conversation
        </div>
      )}
    </aside>
  );
}
