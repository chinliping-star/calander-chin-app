import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Activity, Search, Clock, Archive, CheckCircle, XCircle, Inbox, Star, Loader2, X } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton.tsx';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { cn } from '../../../lib/utils.ts';
import { FriendsSidebar } from '../components/FriendsSidebar.tsx';
import { PendingRequests } from '../components/PendingRequests.tsx';
import { FriendCard } from '../components/FriendCard.tsx';
import { PeopleYouMayKnow } from '../components/PeopleYouMayKnow.tsx';
import { useFriendsApi, type ApiFriend } from '../api/friends.api.ts';
import { useMeetupsApi } from '../../meetup/api/meetups.api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { SidebarSection, FriendProfile } from '../types.ts';

type ViewMode = 'grid' | 'activity';

function apiFriendToProfile(f: ApiFriend): FriendProfile {
  return {
    id: f.friend._id,
    displayName: f.friend.display_name,
    username: f.friend.username,
    avatarUrl: f.friend.avatar_url || `https://i.pravatar.cc/150?u=${f.friend.username}`,
    meetupCount: 0,
    tags: [],
  };
}

// ── Invites (pending meetups where I'm the owner) ─────────────────────────────

function InvitesPanel() {
  const qc = useQueryClient();
  const meetupsApi = useMeetupsApi();
  const { data: meetups = [], isLoading } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    staleTime: 30_000,
  });

  const pending = meetups.filter(m => m.status === 'pending');
  const [responded, setResponded] = useState<Map<string, 'accepted' | 'declined'>>(new Map());

  const accept = useMutation({
    mutationFn: (id: string) => meetupsApi.acceptMeetup(id),
    onSuccess: (_, id) => {
      setResponded(m => new Map([...m, [id, 'accepted']]));
      void qc.invalidateQueries({ queryKey: ['meetups'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => meetupsApi.declineMeetup(id),
    onSuccess: (_, id) => {
      setResponded(m => new Map([...m, [id, 'declined']]));
      void qc.invalidateQueries({ queryKey: ['meetups'] });
    },
  });

  const unresponded = pending.filter(m => !responded.has(m._id));
  const done = pending.filter(m => responded.has(m._id));

  return (
    <section aria-labelledby="invites-heading">
      <div className="mb-5">
        <h2 id="invites-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>Invites</h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          {isLoading ? 'Loading...' : `${unresponded.length} pending invite${unresponded.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {!isLoading && unresponded.length === 0 && done.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text)' }}>
          <Inbox size={40} style={{ opacity: 0.3 }} />
          <p className="text-sm font-medium">No invites right now</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {unresponded.map(inv => (
          <article
            key={inv._id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <img
              src={inv.proposer_id.avatar_url || `https://i.pravatar.cc/150?u=${inv.proposer_id.username}`}
              alt={inv.proposer_id.display_name}
              className="h-11 w-11 rounded-full object-cover shrink-0"
              width={44} height={44}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{inv.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text)' }}>
                Invited by <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{inv.proposer_id.display_name}</span>
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={11} />
                {inv.date}{inv.time ? ` · ${inv.time}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => decline.mutate(inv._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
                style={{ border: '1.5px solid var(--border)', color: 'var(--text)', backgroundColor: 'transparent' }}
              >
                <XCircle size={13} />Decline
              </button>
              <button
                type="button"
                onClick={() => accept.mutate(inv._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 8px var(--accent-border)' }}
              >
                <CheckCircle size={13} />Accept
              </button>
            </div>
          </article>
        ))}

        {done.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text)' }}>Responded</p>
            {done.map(inv => (
              <div
                key={inv._id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-60"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
              >
                <img
                  src={inv.proposer_id.avatar_url || `https://i.pravatar.cc/150?u=${inv.proposer_id.username}`}
                  alt={inv.proposer_id.display_name}
                  className="h-8 w-8 rounded-full object-cover"
                  width={32} height={32}
                />
                <p className="text-sm flex-1 truncate" style={{ color: 'var(--text-h)' }}>{inv.title}</p>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={responded.get(inv._id) === 'accepted'
                    ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {responded.get(inv._id) === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Past Meetups ──────────────────────────────────────────────────────────────

function PastMeetupsPanel() {
  const meetupsApi = useMeetupsApi();
  const { data: meetups = [], isLoading } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    staleTime: 30_000,
  });

  const today = new Date().toISOString().split('T')[0];
  const past = meetups.filter(m => m.date < today && (m.status === 'accepted' || m.status === 'declined'));

  return (
    <section aria-labelledby="past-heading">
      <div className="mb-5">
        <h2 id="past-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>Past Meetups</h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          {isLoading ? 'Loading...' : `${past.length} meetups in history`}
        </p>
      </div>
      {isLoading && (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
      )}
      <div className="flex flex-col gap-3">
        {past.map(m => (
          <article
            key={m._id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <img
              src={m.proposer_id.avatar_url || `https://i.pravatar.cc/150?u=${m.proposer_id.username}`}
              alt={m.proposer_id.display_name}
              className="h-11 w-11 rounded-full object-cover shrink-0"
              width={44} height={44}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{m.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{m.proposer_id.display_name}</span>
                {m.location ? ` · ${m.location}` : ''}
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={11} />{m.date}
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={m.status === 'accepted'
                ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
            >
              {m.status === 'accepted' ? '✓ Went' : '✗ Skipped'}
            </span>
          </article>
        ))}
        {!isLoading && past.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text)' }}>No past meetups yet</p>
        )}
      </div>
    </section>
  );
}

// ── Archived ──────────────────────────────────────────────────────────────────

function ArchivedPanel() {
  const friendsApi = useFriendsApi();
  const { data: archived = [], isLoading } = useQuery({
    queryKey: ['friends', 'archived'],
    queryFn: () => friendsApi.getArchived(),
    staleTime: 30_000,
  });

  return (
    <section aria-labelledby="archived-heading">
      <div className="mb-5">
        <h2 id="archived-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>Archived</h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>Friends you've removed</p>
      </div>
      {isLoading && (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
      )}
      {!isLoading && archived.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text)' }}>
          <Archive size={40} style={{ opacity: 0.3 }} />
          <p className="text-sm font-medium">Nothing archived</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {archived.map(({ friendship_id, friend }) => (
          <div
            key={friendship_id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', opacity: 0.75 }}
          >
            <img
              src={friend.avatar_url || `https://i.pravatar.cc/150?u=${friend.username}`}
              alt={friend.display_name}
              className="h-10 w-10 rounded-full object-cover shrink-0"
              width={40} height={40}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{friend.display_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>@{friend.username}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Add Friend Modal ──────────────────────────────────────────────────────────

function AddFriendModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [localSent, setLocalSent] = useState<Set<string>>(new Set());
  const friendsApi = useFriendsApi();
  const qc = useQueryClient();
  const { user: me } = useAuthStore();

  const { data: friends = [] } = useQuery({ queryKey: ['friends'], queryFn: () => friendsApi.getFriends(), staleTime: 30_000 });
  const { data: outgoing = [] } = useQuery({ queryKey: ['friends', 'outgoing'], queryFn: () => friendsApi.getOutgoing(), staleTime: 30_000 });

  const friendIds = new Set(friends.map(f => f.friend._id));
  const outgoingIds = new Set(outgoing.map(r => (r.recipient_id as unknown as { _id: string })._id ?? String(r.recipient_id)));
  const sentIds = new Set([...outgoingIds, ...localSent]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => query.trim().length >= 1 ? friendsApi.searchUsers(query.trim()) : Promise.resolve([]),
    enabled: query.trim().length >= 1,
    staleTime: 10_000,
  });

  const filtered = results.filter(u => u._id !== me?._id && !friendIds.has(u._id));

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>Find Friends</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:opacity-70 transition-opacity" style={{ color: 'var(--text)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text)' }} />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or username…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {isFetching && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}
          {!isFetching && query.trim().length >= 1 && filtered.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text)' }}>No users found</p>
          )}
          {filtered.map(person => (
            <div key={person._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <img src={person.avatar_url || `https://i.pravatar.cc/150?u=${person.username}`} alt={person.display_name} className="h-10 w-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{person.display_name}</p>
                <p className="text-xs" style={{ color: 'var(--text)' }}>@{person.username}</p>
              </div>
              <button
                type="button"
                onClick={() => !sentIds.has(person._id) && sendReq.mutate(person._id)}
                disabled={sentIds.has(person._id) || sendReq.isPending}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                style={sentIds.has(person._id)
                  ? { backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' }
                  : { backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {sentIds.has(person._id) ? 'Sent ✓' : 'Connect'}
              </button>
            </div>
          ))}
          {!query.trim() && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text)' }}>Type a name or username to search</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── All Friends ───────────────────────────────────────────────────────────────

export function FriendsPage() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const discoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('discover') === 'true') {
      setActiveSection('all');
      setShowAddFriend(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const friendsApi = useFriendsApi();
  const { data: apiFriends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.getFriends(),
    staleTime: 30_000,
    placeholderData: [],
  });

  const friends: FriendProfile[] = apiFriends.map(apiFriendToProfile);

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 3) return prev;
      next.add(id); return next;
    });
  }

  return (
    <AppShell>
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="lg:w-56 lg:shrink-0">
          <FriendsSidebar active={activeSection} onSelect={setActiveSection} onAddFriend={() => setShowAddFriend(true)} />
        </div>

        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {activeSection === 'invites'  && <InvitesPanel />}
          {activeSection === 'past'     && <PastMeetupsPanel />}
          {activeSection === 'archived' && <ArchivedPanel />}
          {activeSection === 'all' && (<>
            <PendingRequests />

            {favorites.size > 0 && (
              <section aria-labelledby="favorites-heading">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} fill="currentColor" style={{ color: '#F59E0B' }} />
                  <h2 id="favorites-heading" className="text-base font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
                    Top Favorites
                  </h2>
                  <span className="text-xs ml-1" style={{ color: 'var(--text)' }}>({favorites.size}/3 pinned)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {friends.filter(f => favorites.has(f.id)).map(friend => (
                    <div key={friend.id} className="relative">
                      <FriendCard friend={friend} />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(friend.id)}
                        aria-label="Remove from favorites"
                        className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
                      >
                        <Star size={12} fill="#F59E0B" color="#F59E0B" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="inner-circle-heading">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 id="inner-circle-heading" className="text-xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
                    Your Inner Circle
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>Star up to 3 friends to pin them at the top.</p>
                </div>

                <div
                  className="flex items-center gap-0.5 p-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
                  role="group" aria-label="View mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2')}
                    style={viewMode === 'grid'
                      ? { backgroundColor: 'var(--bg)', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
                      : { color: 'var(--text)' }}
                  >
                    <LayoutGrid size={13} />Grid View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('activity')}
                    aria-pressed={viewMode === 'activity'}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2')}
                    style={viewMode === 'activity'
                      ? { backgroundColor: 'var(--bg)', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
                      : { color: 'var(--text)' }}
                  >
                    <Activity size={13} />Activity
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl p-4 flex flex-col gap-3" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <Skeleton height={64} rounded="full" width={64} style={{ margin: '0 auto' }} />
                      <Skeleton height={14} rounded="lg" width="60%" style={{ margin: '0 auto' }} />
                      <Skeleton height={12} rounded="lg" width="40%" style={{ margin: '0 auto' }} />
                      <Skeleton height={32} rounded="xl" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && friends.length === 0 && (
                <p className="text-sm text-center py-12" style={{ color: 'var(--text)' }}>No friends yet — start connecting!</p>
              )}

              {!isLoading && friends.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {friends.filter(f => !favorites.has(f.id)).map((friend) => (
                    <div key={friend.id} className="relative">
                      <FriendCard friend={friend} />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(friend.id)}
                        aria-label={favorites.size >= 3 ? 'Max 3 favorites' : 'Add to favorites'}
                        title={favorites.size >= 3 ? 'Max 3 pinned favorites' : 'Pin as favorite'}
                        className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', opacity: favorites.size >= 3 ? 0.4 : 1 }}
                        disabled={favorites.size >= 3}
                      >
                        <Star size={12} color="var(--text)" />
                      </button>
                    </div>
                  ))}

                  <div
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ border: '2px dashed var(--color-primary)', backgroundColor: 'var(--accent-bg)', minHeight: '160px' }}
                    role="button" tabIndex={0} aria-label="Discover more friends"
                    onClick={() => setShowAddFriend(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAddFriend(true); }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-bg)' }}>
                      <Search size={20} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Discover More</p>
                    <p className="text-xs" style={{ color: 'var(--text)' }}>Find colleagues or community groups</p>
                  </div>
                </div>
              )}
            </section>

            <div ref={discoverRef}>
              <PeopleYouMayKnow />
            </div>

            <div className="pb-8" />
          </>)}
        </div>
      </div>
    </AppShell>
  );
}
