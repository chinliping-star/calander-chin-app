import { useState } from 'react';
import { LayoutGrid, Activity, Search } from 'lucide-react';
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

export function FriendsPage() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <AppShell >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left sidebar */}
        <div className="lg:w-56 lg:shrink-0">
          <FriendsSidebar active={activeSection} onSelect={setActiveSection} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Pending Requests */}
          <PendingRequests />

          {/* Inner Circle */}
          <section aria-labelledby="inner-circle-heading">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h2 id="inner-circle-heading" className="text-xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
                  Your Inner Circle
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                  Keep track of your closest connections.
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
                      ? { backgroundColor: '#ffffff', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
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
                      ? { backgroundColor: '#ffffff', color: 'var(--text-h)', boxShadow: '0 1px 4px rgba(74,62,78,0.10)' }
                      : { color: 'var(--text)' }
                  }
                >
                  <Activity size={13} />
                  Activity
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FRIENDS.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}

              {/* Discover More card */}
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  border: '2px dashed var(--color-primary)',
                  backgroundColor: 'rgba(255,127,177,0.04)',
                  minHeight: '160px',
                }}
                role="button"
                tabIndex={0}
                aria-label="Discover more friends"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(255,127,177,0.12)' }}
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
        </div>
      </div>
    </AppShell>
  );
}
