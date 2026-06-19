import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFriendsApi } from '../../friends/api/friends.api.ts';
import {
  useProfileApi,
  type ProfileFriend,
  type ProfileMeetup,
  type ProfileCommunity,
  type ProfileBooking,
} from '../api/profile.api.ts';
import { PostFeed } from '../../posts/components/PostFeed.tsx';
import { NewPostModal } from '../../posts/components/NewPostModal.tsx';
import { usePostsApi } from '../../posts/api/posts.api.ts';
import {
  UserPlus,
  MessageCircle,
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
import { useAuthStore } from '../../../store/auth.ts';
import { api } from '../../../lib/api.ts';
import { effectivePremium } from '../../../lib/featureFlags.ts';
import type { User } from '../../../types/index.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'meetups' | 'friends' | 'interests' | 'bookings' | 'posts';

/** Format a 'YYYY-MM-DD' or ISO date string as e.g. "Jun 7, 2025". */
function formatDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Generic empty-state row for a tab with no real data yet. */
function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10 px-6 text-center"
      style={{ backgroundColor: 'var(--color-neutral)', border: '2px dashed var(--border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--text)' }}>{message}</p>
    </div>
  );
}

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

function OverviewTab({ meetups, friends, interests, onSeeAll }: {
  meetups: ProfileMeetup[];
  friends: ProfileFriend[];
  interests: string[];
  onSeeAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Recent Meetups */}
      <section aria-labelledby="overview-meetups-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="overview-meetups-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
            Recent Meetups
          </h3>
          {meetups.length > 0 && (
            <button
              type="button"
              onClick={onSeeAll}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
              style={{ color: 'var(--color-primary)' }}
            >
              See all <ChevronRight size={12} />
            </button>
          )}
        </div>
        {meetups.length === 0 ? (
          <EmptyState message="No meetups yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {meetups.slice(0, 3).map(meetup => (
              <article
                key={meetup._id}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <img
                  src={meetup.with?.avatar_url || `https://i.pravatar.cc/150?u=${meetup.with?.username ?? meetup._id}`}
                  alt={meetup.with?.display_name ?? 'Friend'}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                  width={36}
                  height={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                    {meetup.with && (
                      <>with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meetup.with.display_name}</span></>
                    )}
                    {meetup.location && (
                      <>
                        {meetup.with ? ' · ' : ''}
                        <MapPin size={10} className="inline" />
                        {' '}{meetup.location}
                      </>
                    )}
                  </p>
                </div>
                <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                  <Clock size={10} />
                  {formatDate(meetup.date)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Friends preview */}
      <section aria-labelledby="overview-friends-heading">
        <h3 id="overview-friends-heading" className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>
          Friends
        </h3>
        {friends.length === 0 ? (
          <EmptyState message="No friends yet." />
        ) : (
          <div className="flex gap-3 flex-wrap">
            {friends.slice(0, 3).map(friend => (
              <Link
                key={friend._id}
                to={`/${friend.username}`}
                className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <img
                  src={friend.avatar_url || `https://i.pravatar.cc/150?u=${friend.username}`}
                  alt={friend.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
                <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-h)' }}>{friend.display_name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text)' }}>@{friend.username}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Interests preview */}
      {interests.length > 0 && (
        <section aria-labelledby="overview-interests-heading">
          <h3 id="overview-interests-heading" className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--accent-border, var(--color-primary))' }}
              >
                {tag}
              </span>
            ))}
            {interests.length > 5 && (
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                +{interests.length - 5} more
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetupsTab({ meetups }: { meetups: ProfileMeetup[] }) {
  return (
    <section aria-labelledby="meetups-tab-heading">
      <h3 id="meetups-tab-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
        Meetup Timeline
      </h3>
      {meetups.length === 0 ? (
        <EmptyState message="No meetups yet." />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[18px] top-0 bottom-0 w-px"
            style={{ backgroundColor: 'var(--border)' }}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-4 pl-10">
            {meetups.map((meetup, idx) => (
              <article key={meetup._id} className="relative">
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
                      src={meetup.with?.avatar_url || `https://i.pravatar.cc/150?u=${meetup.with?.username ?? meetup._id}`}
                      alt={meetup.with?.display_name ?? 'Friend'}
                      className="h-10 w-10 rounded-full object-cover shrink-0 mt-0.5"
                      width={40}
                      height={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
                      {meetup.with && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                          with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meetup.with.display_name}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {meetup.location && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                            <MapPin size={10} />
                            {meetup.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                          <Clock size={10} />
                          {formatDate(meetup.date)}
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
                {idx < meetups.length - 1 && (
                  <div className="h-4" aria-hidden="true" />
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FriendsTab({ friends }: { friends: ProfileFriend[] }) {
  return (
    <section aria-labelledby="friends-tab-heading">
      <div className="flex items-center justify-between mb-4">
        <h3 id="friends-tab-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
          Friends
        </h3>
        {friends.length > 0 && (
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{friends.length} total</span>
        )}
      </div>
      {friends.length === 0 ? (
        <EmptyState message="No friends yet." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {friends.map(friend => (
            <Link
              key={friend._id}
              to={`/${friend.username}`}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="relative">
                <img
                  src={friend.avatar_url || `https://i.pravatar.cc/150?u=${friend.username}`}
                  alt={friend.display_name}
                  className="h-14 w-14 rounded-full object-cover"
                  width={56}
                  height={56}
                />
              </div>
              <p className="text-xs font-bold text-center leading-tight" style={{ color: 'var(--text-h)' }}>
                {friend.display_name}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text)' }}>@{friend.username}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function InterestsTab({ interests, communities }: { interests: string[]; communities: ProfileCommunity[] }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Interest tag cloud */}
      <section aria-labelledby="interests-tags-heading">
        <h3 id="interests-tags-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
          Interests
        </h3>
        {interests.length === 0 ? (
          <EmptyState message="No interests added yet." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {interests.map((tag, idx) => {
              // Vary sizes slightly for a tag-cloud feel
              const sizes = ['text-xs', 'text-sm', 'text-xs', 'text-base', 'text-xs', 'text-sm'];
              const pads  = ['px-3 py-1.5', 'px-4 py-2', 'px-3 py-1.5', 'px-5 py-2.5', 'px-3 py-1.5', 'px-4 py-2'];
              return (
                <span
                  key={tag}
                  className={cn('rounded-full font-semibold cursor-default transition-all', sizes[idx % sizes.length], pads[idx % pads.length])}
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' }}
                >
                  <Tag size={10} className="inline mr-1" aria-hidden="true" />
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* Clubs / Communities */}
      <section aria-labelledby="clubs-heading">
        <h3 id="clubs-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
          Clubs & Groups
        </h3>
        {communities.length === 0 ? (
          <EmptyState message="Not a member of any communities yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {communities.map(club => (
              <Link
                key={club._id}
                to={`/communities/${club.slug}`}
                className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(74,62,78,0.06)' }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0 text-lg font-black overflow-hidden"
                  style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--color-primary)' }}
                  aria-hidden="true"
                >
                  {club.avatar_url
                    ? <img src={club.avatar_url} alt="" className="h-full w-full object-cover" />
                    : club.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{club.name}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                    <Users size={10} />
                    {club.member_count} members
                    {club.category && <> · {club.category}</>}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                  style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
                >
                  View
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BookingsTab({ bookings, isOwn, isPremium }: { bookings: ProfileBooking[]; isOwn: boolean; isPremium: boolean }) {
  const content = bookings.length === 0 ? (
    <EmptyState message="No event bookings yet." />
  ) : (
    <div className="flex flex-col gap-3">
      {bookings.map(booking => (
        <article
          key={booking._id}
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
              <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{booking.title || booking.content}</p>
              {booking.community && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                >
                  {booking.community.name}
                </span>
              )}
            </div>
            {booking.event_date && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={10} />
                {formatDate(booking.event_date)}
              </p>
            )}
            {booking.event_location && (
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <MapPin size={10} />
                {booking.event_location}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <section aria-labelledby="bookings-tab-heading">
      <h3 id="bookings-tab-heading" className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
        Upcoming Bookings
      </h3>
      <PremiumLock
        locked={!isOwn && !isPremium}
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
  { id: 'posts',      label: 'Posts',      icon: <Star size={14} />,      access: 'public' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { user: me } = useAuthStore();
  const isOwnProfile = username === me?.username;
  const viewerIsPremium = effectivePremium(me?.is_premium);
  const postsApi = usePostsApi();
  const friendsApi = useFriendsApi();
  const qc = useQueryClient();
  const [showPostModal, setShowPostModal] = useState(false);

  const createPost = useMutation({
    mutationFn: (data: Parameters<typeof postsApi.create>[0]) => postsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts', username] });
      setShowPostModal(false);
    },
  });

  // Real friend request mutation
  const sendRequest = useMutation({
    mutationFn: () => friendsApi.sendRequest(profileUser!._id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });

  // Check existing friendship status
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.getFriends(),
    enabled: !isOwnProfile,
    staleTime: 30_000,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => friendsApi.getRequests(),
    enabled: !isOwnProfile,
    staleTime: 30_000,
  });

  const isFriend = friends.some(f => f.friend.username === username);
  const hasPendingRequest = requests.some(r =>
    (r.requester_id.username === me?.username && r.recipient_id.username === username) ||
    (r.recipient_id.username === me?.username && r.requester_id.username === username)
  );

  // Aggregated tab data (friends, meetups, interests, communities, bookings)
  const profileApi = useProfileApi();
  const { data: profileData } = useQuery({
    queryKey: ['profile-data', username],
    queryFn: () => profileApi.getProfileData(username!),
    enabled: !!username,
    staleTime: 30_000,
  });
  const tabFriends     = profileData?.friends ?? [];
  const tabMeetups     = profileData?.meetups ?? [];
  const tabCommunities = profileData?.communities ?? [];
  const tabBookings    = profileData?.bookings ?? [];
  const counts = profileData?.counts ?? { friends: 0, meetups: 0, communities: 0 };

  useEffect(() => {
    if (!username) return;
    if (isOwnProfile && me) {
      setProfileUser(me);
      setLoadingProfile(false);
      return;
    }
    api.get<User>(`/users/${username}`)
      .then(u => setProfileUser(u))
      .catch(() => setProfileUser(null))
      .finally(() => setLoadingProfile(false));
  }, [username, isOwnProfile, me]);

  if (loadingProfile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-96">
          <div className="h-8 w-8 rounded-full border-4 animate-spin"
            style={{ borderColor: 'var(--color-tertiary)', borderTopColor: 'var(--color-primary)' }} />
        </div>
      </AppShell>
    );
  }

  if (!profileUser) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-96 gap-3">
          <p className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>User not found</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>@{username} doesn't exist.</p>
        </div>
      </AppShell>
    );
  }

  const displayName = profileUser.display_name || profileUser.username;
  const avatarUrl = profileUser.avatar_url || `https://i.pravatar.cc/150?u=${profileUser.username}`;
  const interests = profileData?.interests ?? (profileUser as User & { interests?: string[] }).interests ?? [];

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
            aria-label={`${displayName}'s profile banner`}
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
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="h-20 w-20 rounded-full object-cover"
                  width={80}
                  height={80}
                  style={{
                    border: '4px solid var(--bg)',
                    boxShadow: '0 4px 16px rgba(74,62,78,0.18)',
                  }}
                />
                {profileUser.is_premium && (
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
                  {!isFriend && (
                    <button
                      type="button"
                      onClick={() => sendRequest.mutate()}
                      disabled={hasPendingRequest || sendRequest.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
                      style={{
                        backgroundColor: hasPendingRequest ? 'var(--color-secondary)' : 'var(--color-primary)',
                        boxShadow: '0 2px 10px rgba(247,127,129,0.35)',
                      }}
                    >
                      <UserPlus size={14} />
                      {sendRequest.isPending ? 'Sending…' : hasPendingRequest ? 'Request Sent' : 'Add Friend'}
                    </button>
                  )}
                  {isFriend && (
                    <span
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--accent-border)' }}
                    >
                      <Users size={14} />
                      Friends
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: 'var(--color-tertiary)', border: '1.5px solid var(--border)' }}
                    aria-label="Send message"
                  >
                    <MessageCircle size={15} style={{ color: 'var(--color-primary)' }} />
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
                  {displayName}
                </h1>
                {profileUser.is_premium && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 mb-2" style={{ color: 'var(--text)' }}>
                @{profileUser.username}
              </p>
              {(profileUser as User & { bio?: string }).bio && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-h)' }}>
                  {(profileUser as User & { bio?: string }).bio}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div
              className="flex items-center gap-0 rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--color-neutral)' }}
              role="list"
              aria-label="Profile statistics"
            >
              {[
                { value: counts.friends, label: 'Friends',  icon: <Users size={14} /> },
                { value: counts.meetups, label: 'Meetups',  icon: <Calendar size={14} /> },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2"
                  style={{
                    borderRight: idx < 1 ? '1px solid var(--border)' : 'none',
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
              const isPremiumLocked = tab.access === 'premium' && !isOwnProfile && !viewerIsPremium;
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
            {activeTab === 'overview'  && <OverviewTab meetups={tabMeetups} friends={tabFriends} interests={interests} onSeeAll={() => setActiveTab('meetups')} />}
            {activeTab === 'meetups'   && <MeetupsTab meetups={tabMeetups} />}
            {activeTab === 'friends'   && <FriendsTab friends={tabFriends} />}
            {activeTab === 'interests' && <InterestsTab interests={interests} communities={tabCommunities} />}
            {activeTab === 'bookings'  && <BookingsTab bookings={tabBookings} isOwn={isOwnProfile} isPremium={viewerIsPremium} />}
            {activeTab === 'posts' && (
              <div className="flex flex-col gap-4">
                {isOwnProfile && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPostModal(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      + New Post
                    </button>
                  </div>
                )}
                <PostFeed username={username!} isOwn={isOwnProfile} myId={me?._id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showPostModal && (
        <NewPostModal
          onClose={() => setShowPostModal(false)}
          onSubmit={data => createPost.mutate(data)}
          submitting={createPost.isPending}
        />
      )}
    </AppShell>
  );
}
