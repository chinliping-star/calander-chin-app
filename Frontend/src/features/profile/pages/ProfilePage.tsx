import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFriendsApi } from '../../friends/api/friends.api.ts';
import {
  useProfileApi,
  type ProfileFriend,
  type ProfileMeetup,
} from '../api/profile.api.ts';
import { ProfileMeetupCalendar } from '../components/ProfileMeetupCalendar.tsx';
import { PostFeed } from '../../posts/components/PostFeed.tsx';
import { NewPostModal } from '../../posts/components/NewPostModal.tsx';
import { usePostsApi } from '../../posts/api/posts.api.ts';
import { THEMES } from '../../../lib/theme.ts';
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
  Flag,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { cn } from '../../../lib/utils.ts';
import { useAuthStore } from '../../../store/auth.ts';
import { ReportModal } from '../../reports/components/ReportModal.tsx';
import { api } from '../../../lib/api.ts';
import { effectivePremium } from '../../../lib/featureFlags.ts';
import type { User } from '../../../types/index.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'meetups' | 'friends' | 'interests' | 'posts';

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

// ── Tab panels ────────────────────────────────────────────────────────────────

// Reusable card shell for the redesigned profile.
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-2xl', className)}
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(74,62,78,0.06)' }}
    >
      {children}
    </div>
  );
}

/** Recent meetups — main-column card. */
function RecentMeetupsCard({ meetups, onSeeAll }: { meetups: ProfileMeetup[]; onSeeAll: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black" style={{ color: 'var(--text-h)' }}>Recent Meetups</h3>
        {meetups.length > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
            style={{ color: 'var(--color-primary)' }}
          >
            See all <ArrowRight size={14} />
          </button>
        )}
      </div>
      {meetups.length === 0 ? (
        <EmptyState message="No meetups yet." />
      ) : (
        <div className="flex flex-col">
          {meetups.slice(0, 3).map((meetup, idx) => (
            <article
              key={meetup._id}
              className="flex items-center gap-4 py-3.5"
              style={idx > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                aria-hidden="true"
              >
                <Calendar size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text)' }}>
                  {meetup.with && (
                    <>with <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meetup.with.display_name}</span></>
                  )}
                  {meetup.location && (
                    <>{meetup.with ? ' · ' : ''}<MapPin size={10} className="inline" /> {meetup.location}</>
                  )}
                </p>
              </div>
              <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <Clock size={12} />
                {formatDate(meetup.date)}
              </span>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

/** About — main-column card. */
function AboutCard({ name, bio }: { name: string; bio?: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-black mb-3" style={{ color: 'var(--text-h)' }}>About {name}</h3>
      {bio ? (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{bio}</p>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text)' }}>No bio yet.</p>
      )}
    </Card>
  );
}

/** Friends — right-rail card with avatar stack. */
function FriendsRailCard({ friends, onViewAll }: { friends: ProfileFriend[]; onViewAll: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black" style={{ color: 'var(--text-h)' }}>Friends</h3>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
        >
          {friends.length} total
        </span>
      </div>
      {friends.length === 0 ? (
        <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>No friends yet.</p>
      ) : (
        <div className="flex items-center mb-4">
          {friends.slice(0, 4).map((f, i) => (
            <img
              key={f._id}
              src={f.avatar_url || `https://i.pravatar.cc/150?u=${f.username}`}
              alt={f.display_name}
              title={f.display_name}
              className="h-10 w-10 rounded-full object-cover"
              style={{ border: '2px solid var(--bg)', marginLeft: i === 0 ? 0 : -10 }}
              width={40}
              height={40}
            />
          ))}
          {friends.length > 4 && (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)', border: '2px solid var(--bg)', marginLeft: -10 }}
            >
              +{friends.length - 4}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onViewAll}
        className="w-full rounded-xl py-2.5 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
        style={{ border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
      >
        View Network
      </button>
    </Card>
  );
}

/** Interests — right-rail card with tag chips. */
function InterestsRailCard({ interests, onViewAll }: { interests: string[]; onViewAll: () => void }) {
  if (interests.length === 0) return null;
  return (
    <Card className="p-6">
      <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-h)' }}>Interests</h3>
      <div className="flex flex-wrap gap-2">
        {interests.slice(0, 8).map((tag, i) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={i % 3 === 0
              ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
              : i % 3 === 1
                ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
                : { backgroundColor: 'var(--color-neutral)', color: 'var(--text)' }}
          >
            {tag}
          </span>
        ))}
      </div>
      {interests.length > 8 && (
        <button type="button" onClick={onViewAll} className="mt-3 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
          See all interests
        </button>
      )}
    </Card>
  );
}

function MeetupsTab({ meetups }: { meetups: ProfileMeetup[] }) {
  return (
    <section aria-labelledby="meetups-tab-heading" className="flex flex-col gap-6">
      {/* Calendar view of their meetups */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>
          Calendar
        </h3>
        <ProfileMeetupCalendar meetups={meetups} />
      </div>

      <h3 id="meetups-tab-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
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

function InterestsTab({ interests }: { interests: string[] }) {
  return (
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
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode; access: 'public' | 'friends' | 'premium' }[] = [
  { id: 'meetups',    label: 'Meetups',    icon: <Calendar size={14} />,  access: 'friends' },
  { id: 'overview',   label: 'Overview',   icon: <BookOpen size={14} />,  access: 'public' },
  { id: 'friends',    label: 'Friends',    icon: <Users size={14} />,     access: 'public' },
  { id: 'interests',  label: 'Interests',  icon: <Tag size={14} />,       access: 'public' },
  { id: 'posts',      label: 'Posts',      icon: <Star size={14} />,      access: 'public' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('meetups');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { user: me } = useAuthStore();
  const isOwnProfile = username === me?.username;
  const [reportOpen, setReportOpen] = useState(false);
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
  const bannerUrl = profileUser.banner_url || '';
  const interests = profileData?.interests ?? (profileUser as User & { interests?: string[] }).interests ?? [];

  const themeMeta = THEMES.find(t => t.id === (profileUser as User & { theme?: string }).theme);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto pb-16 flex flex-col gap-6">
        {/* ── Hero card ── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(74,62,78,0.10)',
          }}
        >
          {/* Banner — cover image (851×315) if set, else gradient */}
          <div
            className="relative h-48 w-full"
            style={
              bannerUrl
                ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: 'linear-gradient(120deg, #d946ef 0%, #a855f7 50%, #7c3aed 100%)' }
            }
            role="img"
            aria-label={`${displayName}'s profile banner`}
          >
            {/* Dark gradient at bottom so overlaid name stays readable */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)' }}
              aria-hidden="true"
            />

            {/* Avatar + name overlaid on cover */}
            <div className="absolute left-6 bottom-4 flex items-end gap-4">
              <img
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                className="h-28 w-28 rounded-full object-cover"
                width={112}
                height={112}
                style={{ border: '4px solid var(--bg)', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}
              />
              <div className="pb-2">
                <h1 className="text-2xl font-black text-white drop-shadow" style={{ margin: 0 }}>{displayName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>@{profileUser.username}</p>
                  {themeMeta && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: themeMeta.primary, color: '#fff' }}
                      title={`${displayName} uses the ${themeMeta.label} theme`}
                    >
                      {themeMeta.label} theme
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons — top-right on cover */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {!isOwnProfile ? (
                <>
                  {!isFriend ? (
                    <button
                      type="button"
                      onClick={() => sendRequest.mutate()}
                      disabled={hasPendingRequest || sendRequest.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                      style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--text-h)' }}
                    >
                      <UserPlus size={15} />
                      {sendRequest.isPending ? 'Sending…' : hasPendingRequest ? 'Requested' : 'Friends'}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--text-h)' }}>
                      <Users size={15} /> Friends
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--color-primary)' }}
                    aria-label="Send message"
                  >
                    <MessageCircle size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--text)' }}
                    aria-label="Report user"
                  >
                    <Flag size={16} />
                  </button>
                </>
              ) : (
                <Link
                  to="/settings?section=profile"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--text-h)' }}
                >
                  <Camera size={15} /> Edit Profile
                </Link>
              )}
            </div>
          </div>

          {reportOpen && profileUser._id && (
            <ReportModal targetType="user" targetId={profileUser._id} onClose={() => setReportOpen(false)} />
          )}

          {/* ── Tab navigation + stat counts ── */}
          <nav
            className="flex items-center gap-1 px-4 overflow-x-auto hide-scrollbar"
            style={{ borderTop: '1px solid var(--border)' }}
            role="tablist"
            aria-label="Profile sections"
          >
            {TABS.map(tab => {
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
                  className="relative flex items-center gap-1.5 py-4 px-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--text)' }}
                  aria-label={`${tab.label}${isPremiumLocked ? ' — Premium feature' : ''}`}
                >
                  {tab.label}
                  {isPremiumLocked && <Lock size={10} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true" />
                  )}
                </button>
              );
            })}

            {/* Stat counts pushed right */}
            <div className="ml-auto flex items-center gap-5 pr-2">
              <button type="button" onClick={() => setActiveTab('friends')} className="flex flex-col items-center focus-visible:outline-none">
                <span className="flex items-center gap-1 text-base font-black" style={{ color: 'var(--color-primary)' }}>
                  <Users size={14} /> {counts.friends}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Friends</span>
              </button>
              <button type="button" onClick={() => setActiveTab('meetups')} className="flex flex-col items-center focus-visible:outline-none">
                <span className="flex items-center gap-1 text-base font-black" style={{ color: 'var(--color-primary)' }}>
                  <Calendar size={14} /> {counts.meetups}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Meetups</span>
              </button>
            </div>
          </nav>
        </div>

        {/* ── Tab content ── */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
              {/* Main column */}
              <div className="flex flex-col gap-6">
                <RecentMeetupsCard meetups={tabMeetups} onSeeAll={() => setActiveTab('meetups')} />
                <AboutCard name={displayName} bio={(profileUser as User & { bio?: string }).bio} />
              </div>
              {/* Right rail */}
              <div className="flex flex-col gap-6">
                <FriendsRailCard friends={tabFriends} onViewAll={() => setActiveTab('friends')} />
                <InterestsRailCard interests={interests} onViewAll={() => setActiveTab('interests')} />
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(74,62,78,0.06)' }}
            >
              {activeTab === 'meetups'   && <MeetupsTab meetups={tabMeetups} />}
              {activeTab === 'friends'   && <FriendsTab friends={tabFriends} />}
              {activeTab === 'interests' && <InterestsTab interests={interests} />}
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
          )}
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
