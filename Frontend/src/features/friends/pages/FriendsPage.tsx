import { useState } from 'react';
import { LayoutGrid, Activity, Search, Clock, Archive, CheckCircle, XCircle, Inbox, Star } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { cn } from '../../../lib/utils.ts';
import { FriendsSidebar } from '../components/FriendsSidebar.tsx';
import { PendingRequests } from '../components/PendingRequests.tsx';
import { FriendCard } from '../components/FriendCard.tsx';
import { PeopleYouMayKnow } from '../components/PeopleYouMayKnow.tsx';
import type { SidebarSection, FriendProfile } from '../types.ts';

const FRIENDS: FriendProfile[] = [
  {
    id: '1',
    displayName: 'Mia Thompson',
    username: 'mia.t',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    nextMeetup: 'Tomorrow',
    meetupCount: 8,
    tags: ['CLOSE FRIEND'],
  },
  {
    id: '2',
    displayName: 'Sara Mitchell',
    username: 'sara.m',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
    nextMeetup: 'Seen 2 days ago',
    meetupCount: 14,
    tags: ['BOOK CLUB'],
  },
  {
    id: '3',
    displayName: 'Jake Rivera',
    username: 'jake.r',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    nextMeetup: 'Activity: Morning Run',
    meetupCount: 5,
    tags: ['GYM BUDDY'],
  },
  {
    id: '4',
    displayName: 'Lily Anderson',
    username: 'lily.a',
    avatarUrl: 'https://i.pravatar.cc/150?img=20',
    nextMeetup: 'Coffee date: Saturday',
    meetupCount: 21,
    tags: ['BEST FRIEND'],
  },
  {
    id: '5',
    displayName: 'Tom Bradley',
    username: 'tom.b',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    nextMeetup: 'Working until 6 PM',
    meetupCount: 3,
    tags: ['WORK COLLEAGUE'],
  },
];

type ViewMode = 'grid' | 'activity';

// ── Invite data ───────────────────────────────────────────────────────────────

const INVITES = [
  { id: 'i1', from: 'Mia Thompson', username: 'mia.t', avatarUrl: 'https://i.pravatar.cc/150?img=5',  event: 'Brunch at Café Bloom', date: 'Sun, Jun 15 · 11:00 AM', mutuals: 3 },
  { id: 'i2', from: 'Jake Rivera',  username: 'jake.r', avatarUrl: 'https://i.pravatar.cc/150?img=12', event: 'Evening Run — Riverside', date: 'Tue, Jun 17 · 6:30 PM',  mutuals: 1 },
  { id: 'i3', from: 'Sara Mitchell',username: 'sara.m', avatarUrl: 'https://i.pravatar.cc/150?img=10', event: 'Book Club: Chapter 8',   date: 'Thu, Jun 19 · 7:00 PM',  mutuals: 5 },
  { id: 'i4', from: 'Lily Anderson',username: 'lily.a', avatarUrl: 'https://i.pravatar.cc/150?img=20', event: 'Movie Night: Dune Pt.2', date: 'Sat, Jun 21 · 8:00 PM',  mutuals: 2 },
  { id: 'i5', from: 'Tom Bradley',  username: 'tom.b',  avatarUrl: 'https://i.pravatar.cc/150?img=15', event: 'Lunch debrief (work)',   date: 'Mon, Jun 16 · 12:30 PM', mutuals: 0 },
  { id: 'i6', from: 'Chloe Davis',  username: 'chloe.d',avatarUrl: 'https://i.pravatar.cc/150?img=25', event: 'Yoga in the Park',      date: 'Wed, Jun 18 · 8:00 AM',  mutuals: 4 },
  { id: 'i7', from: 'Ethan Park',   username: 'ethan.p',avatarUrl: 'https://i.pravatar.cc/150?img=33', event: 'Board Game Night',      date: 'Fri, Jun 20 · 7:30 PM',  mutuals: 2 },
];

// ── Past Meetup data ──────────────────────────────────────────────────────────

const PAST_MEETUPS = [
  { id: 'p1', title: 'Coffee & Catch-up',       with: 'Mia Thompson', avatarUrl: 'https://i.pravatar.cc/150?img=5',  date: 'Jun 7, 2025',  location: 'Brew & Co.',      status: 'accepted' },
  { id: 'p2', title: 'Morning Run',              with: 'Jake Rivera',  avatarUrl: 'https://i.pravatar.cc/150?img=12', date: 'Jun 3, 2025',  location: 'Riverside Park',   status: 'accepted' },
  { id: 'p3', title: 'Dinner at Sakura',         with: 'Lily Anderson',avatarUrl: 'https://i.pravatar.cc/150?img=20', date: 'May 28, 2025', location: 'Sakura Bistro',    status: 'accepted' },
  { id: 'p4', title: 'Study Session',            with: 'Sara Mitchell',avatarUrl: 'https://i.pravatar.cc/150?img=10', date: 'May 22, 2025', location: 'City Library',      status: 'declined' },
  { id: 'p5', title: 'Work Lunch',               with: 'Tom Bradley',  avatarUrl: 'https://i.pravatar.cc/150?img=15', date: 'May 18, 2025', location: 'Noodle House',     status: 'accepted' },
  { id: 'p6', title: 'Yoga in the Park',         with: 'Chloe Davis',  avatarUrl: 'https://i.pravatar.cc/150?img=25', date: 'May 10, 2025', location: 'Riverside Park',   status: 'accepted' },
];

// ── Archived friends ──────────────────────────────────────────────────────────

const ARCHIVED = [
  { id: 'a1', displayName: 'Chris Evans',  username: 'chris.e', avatarUrl: 'https://i.pravatar.cc/150?img=60', archivedOn: 'Mar 2025', reason: 'Lost touch' },
  { id: 'a2', displayName: 'Priya Sharma', username: 'priya.s', avatarUrl: 'https://i.pravatar.cc/150?img=44', archivedOn: 'Jan 2025', reason: 'Moved abroad' },
  { id: 'a3', displayName: 'Lucas White',  username: 'lucas.w', avatarUrl: 'https://i.pravatar.cc/150?img=52', archivedOn: 'Dec 2024', reason: 'Mutual distance' },
];

// ── Section panels ────────────────────────────────────────────────────────────

function InvitesPanel() {
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const pending = INVITES.filter(i => !accepted.has(i.id) && !declined.has(i.id));
  const done    = INVITES.filter(i =>  accepted.has(i.id) ||  declined.has(i.id));

  return (
    <section aria-labelledby="invites-heading">
      <div className="mb-5">
        <h2 id="invites-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>
          Invites
        </h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          {pending.length} pending invite{pending.length !== 1 ? 's' : ''}
        </p>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text)' }}>
          <Inbox size={40} style={{ opacity: 0.3 }} />
          <p className="text-sm font-medium">No invites right now</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pending.map(inv => (
          <article
            key={inv.id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <img src={inv.avatarUrl} alt={inv.from} className="h-11 w-11 rounded-full object-cover shrink-0" width={44} height={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{inv.event}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text)' }}>
                Invited by <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{inv.from}</span>
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={11} />
                {inv.date}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeclined(s => new Set([...s, inv.id]))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
                style={{ border: '1.5px solid var(--border)', color: 'var(--text)', backgroundColor: 'transparent' }}
              >
                <XCircle size={13} />
                Decline
              </button>
              <button
                type="button"
                onClick={() => setAccepted(s => new Set([...s, inv.id]))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 8px var(--accent-border)' }}
              >
                <CheckCircle size={13} />
                Accept
              </button>
            </div>
          </article>
        ))}

        {done.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text)' }}>Responded</p>
            {done.map(inv => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-60"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
              >
                <img src={inv.avatarUrl} alt={inv.from} className="h-8 w-8 rounded-full object-cover" width={32} height={32} />
                <p className="text-sm flex-1 truncate" style={{ color: 'var(--text-h)' }}>{inv.event}</p>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={accepted.has(inv.id)
                    ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {accepted.has(inv.id) ? '✓ Accepted' : '✗ Declined'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PastMeetupsPanel() {
  return (
    <section aria-labelledby="past-heading">
      <div className="mb-5">
        <h2 id="past-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>Past Meetups</h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>{PAST_MEETUPS.length} meetups in history</p>
      </div>
      <div className="flex flex-col gap-3">
        {PAST_MEETUPS.map(m => (
          <article
            key={m.id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <img src={m.avatarUrl} alt={m.with} className="h-11 w-11 rounded-full object-cover shrink-0" width={44} height={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{m.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{m.with}</span>
                {' · '}
                <span>{m.location}</span>
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={11} />
                {m.date}
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
      </div>
    </section>
  );
}

function ArchivedPanel() {
  const [restored, setRestored] = useState<Set<string>>(new Set());
  const visible = ARCHIVED.filter(a => !restored.has(a.id));

  return (
    <section aria-labelledby="archived-heading">
      <div className="mb-5">
        <h2 id="archived-heading" style={{ color: 'var(--text-h)', margin: '0 0 4px', fontSize: '20px' }}>Archived</h2>
        <p className="text-sm" style={{ color: 'var(--text)' }}>Friends you've quietly put on hold</p>
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text)' }}>
          <Archive size={40} style={{ opacity: 0.3 }} />
          <p className="text-sm font-medium">Nothing archived</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visible.map(a => (
          <article
            key={a.id}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <img src={a.avatarUrl} alt={a.displayName} className="h-11 w-11 rounded-full object-cover shrink-0 grayscale opacity-70" width={44} height={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{a.displayName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>@{a.username}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text)', opacity: 0.7 }}>
                Archived {a.archivedOn} · {a.reason}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRestored(s => new Set([...s, a.id]))}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none shrink-0"
              style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
            >
              Restore
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── All Friends view ──────────────────────────────────────────────────────────

export function FriendsPage() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '4'])); // Mia + Lily default

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 3) return prev; // max 3
      next.add(id); return next;
    });
  }


  return (
    <AppShell >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left sidebar */}
        <div className="lg:w-56 lg:shrink-0">
          <FriendsSidebar active={activeSection} onSelect={setActiveSection} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {activeSection === 'invites'  && <InvitesPanel />}
          {activeSection === 'past'     && <PastMeetupsPanel />}
          {activeSection === 'archived' && <ArchivedPanel />}
          {activeSection === 'all' && (<>
          {/* Pending Requests */}
          <PendingRequests />

          {/* ⭐ Top 3 Favorites */}
          {favorites.size > 0 && (
            <section aria-labelledby="favorites-heading">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} fill="currentColor" style={{ color: '#F59E0B' }} />
                <h2 id="favorites-heading" className="text-base font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
                  Top Favorites
                </h2>
                <span className="text-xs ml-1" style={{ color: 'var(--text)' }}>
                  ({favorites.size}/3 pinned)
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {FRIENDS.filter(f => favorites.has(f.id)).map(friend => (
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

          {/* Inner Circle */}
          <section aria-labelledby="inner-circle-heading">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h2 id="inner-circle-heading" className="text-xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
                  Your Inner Circle
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                  Star up to 3 friends to pin them at the top.
                </p>
              </div>

              {/* View toggle */}
              <div
                className="flex items-center gap-0.5 p-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
                  )}
                  style={
                    viewMode === 'grid'
                      ? { backgroundColor: 'var(--bg)', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
                      : { color: 'var(--text)' }
                  }
                >
                  <LayoutGrid size={13} />
                  Grid View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('activity')}
                  aria-pressed={viewMode === 'activity'}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
                  )}
                  style={
                    viewMode === 'activity'
                      ? { backgroundColor: 'var(--bg)', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
                      : { color: 'var(--text)' }
                  }
                >
                  <Activity size={13} />
                  Activity
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* All friends — non-favorites first, then random 2 suggested */}
              {FRIENDS.filter(f => !favorites.has(f.id)).map((friend) => (
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

              {/* Discover More card */}
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  border: '2px dashed var(--color-primary)',
                  backgroundColor: 'var(--accent-bg)',
                  minHeight: '160px',
                }}
                role="button"
                tabIndex={0}
                aria-label="Discover more friends"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--accent-bg)' }}
                >
                  <Search size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Discover More
                </p>
                <p className="text-xs" style={{ color: 'var(--text)' }}>
                  Find colleagues or community groups
                </p>
              </div>
            </div>
          </section>

          {/* People You May Know */}
          <PeopleYouMayKnow />

          {/* Bottom padding */}
          <div className="pb-8" />
          </>)}
        </div>
      </div>
    </AppShell>
  );
}
