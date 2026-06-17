import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useFriendsApi, type ApiFriendUser } from '../api/friends.api.ts';
import { useAuthStore } from '../../../store/auth.ts';

export function PeopleYouMayKnow() {
  const [localSent, setLocalSent] = useState<Set<string>>(new Set());
  const qc = useQueryClient();
  const friendsApi = useFriendsApi();
  const { user: me } = useAuthStore();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'search', ''],
    queryFn: () => friendsApi.searchUsers('a'),
    staleTime: 60_000,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.getFriends(),
    staleTime: 30_000,
  });

  const { data: outgoing = [] } = useQuery({
    queryKey: ['friends', 'outgoing'],
    queryFn: () => friendsApi.getOutgoing(),
    staleTime: 30_000,
  });

  const friendIds = new Set(friends.map(f => f.friend._id));
  const friendUsernames = new Set(friends.map(f => f.friend.username));
  const outgoingIds = new Set(outgoing.map(r => (r.recipient_id as unknown as { _id: string })._id ?? String(r.recipient_id)));
  const sentIds = new Set([...outgoingIds, ...localSent]);

  const suggestions = allUsers
    .filter(u =>
      u.username !== me?.username &&
      u._id !== me?._id &&
      !friendUsernames.has(u.username) &&
      !friendIds.has(u._id)
    )
    .slice(0, 4);

  const sendReq = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: (_, userId) => {
      setLocalSent(s => new Set([...s, userId]));
      void qc.invalidateQueries({ queryKey: ['friends', 'outgoing'] });
    },
    onError: (err: unknown, userId) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('pending')) {
        setLocalSent(s => new Set([...s, userId]));
      }
    },
  });

  if (suggestions.length === 0) return null;

  return (
    <section aria-labelledby="people-heading">
      <div className="flex items-center justify-between mb-5">
        <h2
          id="people-heading"
          className="text-lg font-bold tracking-tight"
          style={{ color: 'var(--text-h)', margin: 0 }}
        >
          People you may know
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {suggestions.map((person) => (
          <PersonCard
            key={person._id}
            person={person}
            sent={sentIds.has(person._id)}
            onConnect={() => sendReq.mutate(person._id)}
          />
        ))}
      </div>
    </section>
  );
}

function PersonCard({ person, sent, onConnect }: { person: ApiFriendUser; sent: boolean; onConnect: () => void }) {
  return (
    <div
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
      <Link
        to={`/${person.username}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-t-xl"
        style={{ textDecoration: 'none' }}
        aria-label={`View ${person.display_name}'s profile`}
      >
        <div className="w-full flex items-center justify-center pt-4" style={{ backgroundColor: 'var(--color-neutral)' }}>
          <div className="w-16 h-16 overflow-hidden rounded-full">
            <img
              src={person.avatar_url || `https://i.pravatar.cc/150?u=${person.username}`}
              alt={person.display_name}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-3.5">
        <Link
          to={`/${person.username}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded"
          style={{ textDecoration: 'none' }}
          aria-label={`View ${person.display_name}'s profile`}
        >
          <p className="text-sm font-bold leading-snug hover:underline" style={{ color: 'var(--text-h)' }}>
            {person.display_name}
          </p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>
            @{person.username}
          </p>
        </Link>

        <button
          type="button"
          onClick={onConnect}
          disabled={sent}
          className="w-full py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          style={{
            backgroundColor: sent ? 'var(--color-tertiary)' : 'transparent',
            border: '1.5px solid var(--color-primary)',
            color: sent ? 'var(--color-primary)' : 'var(--color-primary)',
            opacity: sent ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!sent) {
              const btn = e.currentTarget;
              btn.style.backgroundColor = 'var(--color-primary)';
              btn.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (!sent) {
              const btn = e.currentTarget;
              btn.style.backgroundColor = 'transparent';
              btn.style.color = 'var(--color-primary)';
            }
          }}
        >
          {sent ? 'Request Sent' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
