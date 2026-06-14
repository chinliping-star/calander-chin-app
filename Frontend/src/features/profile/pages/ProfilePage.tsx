import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UserPlus,
  MessageCircle,
  Bell,
  Lock,
  MapPin,
  Clock,
  Users,
  Calendar,
  Camera,
  Star,
  Tag,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { cn } from '../../../lib/utils.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'meetups' | 'friends' | 'interests' | 'bookings';

interface Friend {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  isMutual?: boolean;
}

interface Meetup {
  id: string;
  title: string;
  withFriend: string;
  withAvatar: string;
  date: string;
  location: string;
  status: 'accepted' | 'pending' | 'declined';
}

interface Booking {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'event' | 'class' | 'reservation';
}

interface Club {
  id: string;
  name: string;
  membersCount: number;
  emoji: string;
}

// ── Fake data ─────────────────────────────────────────────────────────────────

const PROFILE_USER = {
  displayName: 'Muneb',
  username: 'muneb.star',
  bio: "Social enthusiast and diary keeper. Let's make every meetup count! Coffee addict, occasional runner, and board game champion.",
  avatarUrl: 'https://i.pravatar.cc/150?img=3',
  bannerUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
  friendsCount: 42,
  meetupsCount: 86,
  photosCount: 23,
  isPremium: true,
};

const FRIENDS: Friend[] = [
  { id: '1', displayName: 'Mia Thompson',  username: 'mia.t',  avatarUrl: 'https://i.pravatar.cc/150?img=5',  isMutual: true },
  { id: '2', displayName: 'Sara Mitchell', username: 'sara.m', avatarUrl: 'https://i.pravatar.cc/150?img=10', isMutual: true },
  { id: '3', displayName: 'Jake Rivera',   username: 'jake.r', avatarUrl: 'https://i.pravatar.cc/150?img=12', isMutual: false },
  { id: '4', displayName: 'Lily Anderson', username: 'lily.a', avatarUrl: 'https://i.pravatar.cc/150?img=20', isMutual: true },
  { id: '5', displayName: 'Tom Bradley',   username: 'tom.b',  avatarUrl: 'https://i.pravatar.cc/150?img=15', isMutual: false },
];

const MUTUAL_FRIENDS = FRIENDS.filter(f => f.isMutual).slice(0, 3);

const MEETUPS: Meetup[] = [
  { id: 'm1', title: 'Coffee & Catch-up',    withFriend: 'Mia Thompson',  withAvatar: 'https://i.pravatar.cc/150?img=5',  date: 'Jun 7, 2025',  location: 'Brew & Co.',      status: 'accepted' },
  { id: 'm2', title: 'Morning Run',           withFriend: 'Jake Rivera',   withAvatar: 'https://i.pravatar.cc/150?img=12', date: 'Jun 3, 2025',  location: 'Riverside Park',  status: 'accepted' },
  { id: 'm3', title: 'Dinner at Sakura',      withFriend: 'Lily Anderson', withAvatar: 'https://i.pravatar.cc/150?img=20', date: 'May 28, 2025', location: 'Sakura Bistro',   status: 'accepted' },
  { id: 'm4', title: 'Book Club: Chapter 8',  withFriend: 'Sara Mitchell', withAvatar: 'https://i.pravatar.cc/150?img=10', date: 'May 22, 2025', location: 'City Library',    status: 'accepted' },
  { id: 'm5', title: 'Work Lunch',            withFriend: 'Tom Bradley',   withAvatar: 'https://i.pravatar.cc/150?img=15', date: 'May 18, 2025', location: 'Noodle House',    status: 'accepted' },
  { id: 'm6', title: 'Yoga in the Park',      withFriend: 'Mia Thompson',  withAvatar: 'https://i.pravatar.cc/150?img=5',  date: 'May 10, 2025', location: 'Green Fields',    status: 'accepted' },
];

const INTEREST_TAGS = ['Reading', 'Yoga', 'Coffee', 'Board Games', 'Running', 'Cooking', 'Travel', 'Music'];

const CLUBS: Club[] = [
  { id: 'c1', name: 'Book Club',       membersCount: 12, emoji: '📚' },
  { id: 'c2', name: 'Running Club',    membersCount: 28, emoji: '🏃' },
  { id: 'c3', name: 'Coding Meetup',   membersCount: 45, emoji: '💻' },
];

const BOOKINGS: Booking[] = [
  { id: 'b1', title: 'Pottery Workshop',      date: 'Jun 18, 2025', time: '2:00 PM',  location: 'Clay Studio, Downtown', type: 'class' },
  { id: 'b2', title: 'Jazz Night at Blu Bar', date: 'Jun 21, 2025', time: '8:30 PM',  location: 'Blu Bar & Grill',       type: 'event' },
  { id: 'b3', title: 'Brunch Reservation',    date: 'Jun 22, 2025', time: '11:00 AM', location: 'Café Bloom, Westside',  type: 'reservation' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * PremiumLock: blurred overlay with upgrade CTA, wraps locked content.
 * Renders children normally when `locked` is false.
 */
function PremiumLock({ children, locked, message = 'Upgrade to Pro to view this section' }: {
  children: React.ReactNode;
  locked: boolean;
  message?: string;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred background content */}
      <div aria-hidden="true" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.4 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
        style={{ backgroundColor: 'rgba(247,240,245,0.85)', backdropFilter: 'blur(2px)' }}
        role="region"
        aria-label="Premium locked content"
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-tertiary)', border: '2px solid var(--color-primary)', boxShadow: '0 4px 16px rgba(247,127,129,0.2)' }}
        >
          <Lock size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-h)' }}>Premium Feature</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{message}</p>
        </div>
        <Link
          to="/pricing"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 12px rgba(247,127,129,0.4)', focusRingColor: 'var(--color-primary)' } as React.CSSProperties}
        >
          <Star size={14} fill="currentColor" />
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Recent Meetups */}
      <section aria-labelledby="overview-meetups-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="overview-meetups-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
            Recent Meetups
          </h3>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
            style={{ color: 'var(--color-primary)' }}
          >
            See all <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {MEETUPS.slice(0, 3).map(meetup => (
            <article
              key={meetup.id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <img
                src={meetup.withAvatar}
                alt={meetup.withFriend}
                className="h-9 w-9 rounded-full object-cover shrink-0"
                width={36}
                height={36}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                  with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meetup.withFriend}</span>
                  {' · '}
                  <MapPin size={10} className="inline" />
                  {' '}{meetup.location}
                </p>
              </div>
              <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={10} />
                {meetup.date}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* Mutual Friends */}
      <section aria-labelledby="overview-mutuals-heading">
        <h3 id="overview-mutuals-heading" className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>
          Mutual Friends
        </h3>
        <div className="flex gap-3 flex-wrap">
          {MUTUAL_FRIENDS.map(friend => (
            <Link
              key={friend.id}
              to={`/${friend.username}`}
              className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <img
                src={friend.avatarUrl}
                alt={friend.displayName}
                className="h-10 w-10 rounded-full object-cover"
                width={40}
                height={40}
              />
              <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-h)' }}>{friend.displayName}</p>
              <p className="text-[10px]" style={{ color: 'var(--text)' }}>@{friend.username}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Interests preview */}
      <section aria-labelledby="overview-interests-heading">
        <h3 id="overview-interests-heading" className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>
          Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.slice(0, 5).map(tag => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--accent-border, var(--color-primary))' }}
            >
              {tag}
            </span>
          ))}
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            +{INTEREST_TAGS.length - 5} more
          </span>
        </div>
      </section>
    </div>
  );
}

function MeetupsTab() {
  return (
    <section aria-labelledby="meetups-tab-heading">
      <h3 id="meetups-tab-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
        Meetup Timeline
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-[18px] top-0 bottom-0 w-px"
          style={{ backgroundColor: 'var(--border)' }}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-4 pl-10">
          {MEETUPS.map((meetup, idx) => (
            <article key={meetup.id} className="relative">
              {/* Timeline dot */}
              <div
                className="absolute -left-[30px] top-4 h-3 w-3 rounded-full border-2"
                style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--bg)' }}
                aria-hidden="true"
              />
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={meetup.withAvatar}
                    alt={meetup.withFriend}
                    className="h-10 w-10 rounded-full object-cover shrink-0 mt-0.5"
                    width={40}
                    height={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                      with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meetup.withFriend}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                        <MapPin size={10} />
                        {meetup.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                        <Clock size={10} />
                        {meetup.date}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                  >
                    Went
                  </span>
                </div>
              </div>
              {/* Connector to next */}
              {idx < MEETUPS.length - 1 && (
                <div className="h-4" aria-hidden="true" />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FriendsTab() {
  return (
    <section aria-labelledby="friends-tab-heading">
      <div className="flex items-center justify-between mb-4">
        <h3 id="friends-tab-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
          Friends · {PROFILE_USER.friendsCount}
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {FRIENDS.map(friend => (
          <Link
            key={friend.id}
            to={`/${friend.username}`}
            className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div className="relative">
              <img
                src={friend.avatarUrl}
                alt={friend.displayName}
                className="h-14 w-14 rounded-full object-cover"
                width={56}
                height={56}
              />
              {friend.isMutual && (
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
                  title="Mutual friend"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Users size={9} color="white" />
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-center leading-tight" style={{ color: 'var(--text-h)' }}>
              {friend.displayName}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text)' }}>@{friend.username}</p>
            {friend.isMutual && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
              >
                Mutual
              </span>
            )}
          </Link>
        ))}
        {/* Placeholder card for remaining */}
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--color-neutral)', border: '2px dashed var(--border)', minHeight: '140px' }}
          aria-label={`+${PROFILE_USER.friendsCount - FRIENDS.length} more friends`}
        >
          <p className="text-lg font-black" style={{ color: 'var(--color-primary)' }}>
            +{PROFILE_USER.friendsCount - FRIENDS.length}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text)' }}>more friends</p>
        </div>
      </div>
    </section>
  );
}

function InterestsTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Interest tag cloud */}
      <section aria-labelledby="interests-tags-heading">
        <h3 id="interests-tags-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
          Interests
        </h3>
        <div className="flex flex-wrap gap-3">
          {INTEREST_TAGS.map((tag, idx) => {
            // Vary sizes slightly for a tag-cloud feel
            const sizes = ['text-xs', 'text-sm', 'text-xs', 'text-base', 'text-xs', 'text-sm', 'text-xs', 'text-sm'];
            const pads  = ['px-3 py-1.5', 'px-4 py-2', 'px-3 py-1.5', 'px-5 py-2.5', 'px-3 py-1.5', 'px-4 py-2', 'px-3 py-1.5', 'px-4 py-2'];
            return (
              <span
                key={tag}
                className={cn('rounded-full font-semibold cursor-default transition-all', sizes[idx], pads[idx])}
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' }}
              >
                <Tag size={10} className="inline mr-1" aria-hidden="true" />
                {tag}
              </span>
            );
          })}
        </div>
      </section>

      {/* Clubs */}
      <section aria-labelledby="clubs-heading">
        <h3 id="clubs-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
          Clubs & Groups
        </h3>
        <div className="flex flex-col gap-3">
          {CLUBS.map(club => (
            <div
              key={club.id}
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0 text-2xl"
                style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
                aria-hidden="true"
              >
                {club.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{club.name}</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                  <Users size={10} />
                  {club.membersCount} members
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 shrink-0"
                style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BookingsTab({ isOwn }: { isOwn: boolean }) {
  const bookingTypeColors: Record<Booking['type'], { bg: string; text: string; label: string }> = {
    event:       { bg: 'rgba(167,139,250,0.15)', text: '#7c3aed', label: 'Event' },
    class:       { bg: 'var(--accent-bg)',        text: 'var(--color-primary)', label: 'Class' },
    reservation: { bg: 'rgba(52,211,153,0.15)',   text: '#059669', label: 'Reservation' },
  };

  const content = (
    <div className="flex flex-col gap-3">
      {BOOKINGS.map(booking => {
        const badge = bookingTypeColors[booking.type];
        return (
          <article
            key={booking.id}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
          >
            <div
              className="flex h-12 w-12 flex-col items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
              aria-hidden="true"
            >
              <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{booking.title}</p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={10} />
                {booking.date} at {booking.time}
              </p>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <MapPin size={10} />
                {booking.location}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <section aria-labelledby="bookings-tab-heading">
      <h3 id="bookings-tab-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
        Upcoming Bookings
      </h3>
      <PremiumLock
        locked={!isOwn}
        message="Upgrade to Pro to view booking history on friend profiles"
      >
        {content}
      </PremiumLock>
    </section>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode; access: 'public' | 'friends' | 'premium' }[] = [
  { id: 'overview',   label: 'Overview',   icon: <BookOpen size={14} />,  access: 'public' },
  { id: 'meetups',    label: 'Meetups',    icon: <Calendar size={14} />,  access: 'friends' },
  { id: 'friends',    label: 'Friends',    icon: <Users size={14} />,     access: 'public' },
  { id: 'interests',  label: 'Interests',  icon: <Tag size={14} />,       access: 'public' },
  { id: 'bookings',   label: 'Bookings',   icon: <Clock size={14} />,     access: 'premium' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [friendAdded, setFriendAdded] = useState(false);
  const [following, setFollowing] = useState(false);

  // For now, check if own profile by comparing to hardcoded username
  const isOwnProfile = username === PROFILE_USER.username;

  function handleAddFriend() {
    setFriendAdded(prev => !prev);
  }

  function handleFollow() {
    setFollowing(prev => !prev);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-16">
        {/* ── Hero card ── */}
        <div
          className="rounded-3xl overflow-hidden mb-6"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(74,62,78,0.10)',
          }}
        >
          {/* Banner */}
          <div
            className="relative h-36 w-full"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #c084fc 60%, var(--color-secondary) 100%)',
            }}
            role="img"
            aria-label={`${PROFILE_USER.displayName}'s profile banner`}
          >
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)',
              }}
              aria-hidden="true"
            />
            {isOwnProfile && (
              <Link
                to="/settings?section=profile"
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
                aria-label="Edit profile"
              >
                <Camera size={12} />
                Edit Profile
              </Link>
            )}
          </div>

          {/* Profile info */}
          <div className="px-6 pb-6">
            {/* Avatar + action buttons row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <img
                  src={PROFILE_USER.avatarUrl}
                  alt={`${PROFILE_USER.displayName}'s avatar`}
                  className="h-20 w-20 rounded-full object-cover"
                  width={80}
                  height={80}
                  style={{
                    border: '4px solid var(--bg)',
                    boxShadow: '0 4px 16px rgba(74,62,78,0.18)',
                  }}
                />
                {PROFILE_USER.isPremium && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full"
                    title="Premium member"
                    style={{ backgroundColor: 'var(--color-primary)', border: '2px solid var(--bg)' }}
                    aria-label="Premium member"
                  >
                    <Star size={11} fill="white" color="white" />
                  </span>
                )}
              </div>

              {/* Action buttons */}
              {!isOwnProfile && (
                <div className="flex items-center gap-2 mt-12">
                  <button
                    type="button"
                    onClick={handleAddFriend}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                    style={{
                      backgroundColor: friendAdded ? 'var(--color-secondary)' : 'var(--color-primary)',
                      boxShadow: '0 2px 10px rgba(247,127,129,0.35)',
                    }}
                    aria-pressed={friendAdded}
                  >
                    <UserPlus size={14} />
                    {friendAdded ? 'Request Sent' : 'Add Friend'}
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: 'var(--color-tertiary)', border: '1.5px solid var(--border)' }}
                    aria-label="Send message"
                  >
                    <MessageCircle size={15} style={{ color: 'var(--color-primary)' }} />
                  </button>
                  <button
                    type="button"
                    onClick={handleFollow}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      backgroundColor: following ? 'var(--accent-bg)' : 'var(--color-tertiary)',
                      border: following ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border)',
                    }}
                    aria-pressed={following}
                    aria-label={following ? 'Unfollow' : 'Follow'}
                  >
                    <Bell size={15} style={{ color: following ? 'var(--color-primary)' : 'var(--text)' }} />
                  </button>
                </div>
              )}

              {isOwnProfile && (
                <div className="mt-12">
                  <Link
                    to="/settings?section=profile"
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                    style={{ border: '1.5px solid var(--border)', color: 'var(--text-h)', backgroundColor: 'transparent' }}
                  >
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Name + username + bio */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black" style={{ color: 'var(--text-h)', margin: 0 }}>
                  {PROFILE_USER.displayName}
                </h1>
                {PROFILE_USER.isPremium && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 mb-2" style={{ color: 'var(--text)' }}>
                @{PROFILE_USER.username}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-h)' }}>
                {PROFILE_USER.bio}
              </p>
            </div>

            {/* Stats row */}
            <div
              className="flex items-center gap-0 rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--color-neutral)' }}
              role="list"
              aria-label="Profile statistics"
            >
              {[
                { value: PROFILE_USER.friendsCount, label: 'Friends',  icon: <Users size={14} /> },
                { value: PROFILE_USER.meetupsCount,  label: 'Meetups',  icon: <Calendar size={14} /> },
                { value: PROFILE_USER.photosCount,   label: 'Photos',   icon: <Camera size={14} /> },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2"
                  style={{
                    borderRight: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}
                  role="listitem"
                >
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
                    {stat.icon}
                  </div>
                  <p className="text-base font-black leading-tight" style={{ color: 'var(--text-h)' }}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div
          className="rounded-2xl mb-6 overflow-hidden"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(74,62,78,0.06)',
          }}
        >
          <nav
            className="flex"
            role="tablist"
            aria-label="Profile sections"
          >
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const isPremiumLocked = tab.access === 'premium' && !isOwnProfile;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex flex-1 flex-col items-center gap-1 py-3 px-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
                  )}
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--text)',
                    backgroundColor: isActive ? 'var(--color-tertiary)' : 'transparent',
                    borderRight: idx < TABS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  aria-label={`${tab.label}${isPremiumLocked ? ' — Premium feature' : ''}`}
                >
                  <span
                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--text)' }}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isPremiumLocked && (
                    <Lock
                      size={8}
                      className="absolute top-1.5 right-1.5"
                      style={{ color: 'var(--color-primary)' }}
                      aria-hidden="true"
                    />
                  )}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Tab content ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(74,62,78,0.06)',
          }}
        >
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'overview'  && <OverviewTab />}
            {activeTab === 'meetups'   && <MeetupsTab />}
            {activeTab === 'friends'   && <FriendsTab />}
            {activeTab === 'interests' && <InterestsTab />}
            {activeTab === 'bookings'  && <BookingsTab isOwn={isOwnProfile} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
