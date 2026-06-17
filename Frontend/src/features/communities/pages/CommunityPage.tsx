import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ArrowLeft, Lock, Send } from 'lucide-react';
import { useCommunitiesApi } from '../api/communities.api';
import { Navbar } from '../../../components/layout/Navbar.tsx';
import { useAuthStore } from '../../../store/auth';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { MemberList } from '../components/MemberList';
import type { CommunityPost } from '../types';

type Tab = 'posts' | 'events' | 'announcements' | 'members';

export function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const api = useCommunitiesApi();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const [tab, setTab] = useState<Tab>('posts');
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'post' | 'announcement' | 'event'>('post');

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', slug],
    queryFn: () => api.getBySlug(slug!),
    enabled: !!slug,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', community?._id],
    queryFn: () => api.getPosts(community!._id),
    enabled: !!community?._id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['community-members', community?._id],
    queryFn: () => api.getMembers(community!._id),
    enabled: !!community?._id && tab === 'members',
  });

  const { data: mine = [] } = useQuery({
    queryKey: ['communities-mine'],
    queryFn: () => api.getMine(),
    enabled: !!user,
  });

  const isMember = mine.some((c: { _id: string }) => c._id === community?._id) || !!community?.userRole;
  const userRole = community?.userRole;
  const isModOrOwner = userRole === 'owner' || userRole === 'moderator';
  const isOwner = userRole === 'owner';

  const join = useMutation({
    mutationFn: () => api.join(community!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities-mine'] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
  });

  const leave = useMutation({
    mutationFn: () => api.leave(community!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities-mine'] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
  });

  const createPost = useMutation({
    mutationFn: () => api.createPost(community!._id, { content: newPost, type: postType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', community?._id] });
      setNewPost('');
      setPostType('post');
    },
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => api.deletePost(community!._id, postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-posts', community?._id] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'moderator' | 'member' }) =>
      api.updateRole(community!._id, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-members', community?._id] }),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.removeMember(community!._id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-members', community?._id] }),
  });

  if (loadingCommunity) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-neutral)' }}>
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p style={{ color: 'var(--text)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-neutral)' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <p className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>Community not found</p>
          <button onClick={() => navigate('/communities')} style={{ color: 'var(--color-primary)' }}>Back to Communities</button>
        </div>
      </div>
    );
  }

  const filteredPosts: CommunityPost[] = tab === 'posts'
    ? posts.filter((p: CommunityPost) => p.type !== 'announcement' && p.type !== 'event')
    : tab === 'announcements'
    ? posts.filter((p: CommunityPost) => p.type === 'announcement')
    : tab === 'events'
    ? posts.filter((p: CommunityPost) => p.type === 'event')
    : [];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'events', label: 'Events' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'members', label: `Members (${community.member_count})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-neutral)' }}>
      <Navbar />
      {/* Banner */}
      <div
        className="h-40 relative"
        style={{ background: community.banner_url ? undefined : 'var(--color-primary-light)' }}
      >
        {community.banner_url && (
          <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate('/communities')}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
        >
          <ArrowLeft size={14} /> Communities
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Community header */}
        <div
          className="rounded-2xl p-5 -mt-6 relative z-10 mb-6"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {community.avatar_url
                ? <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
                : community.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-h)' }}>{community.name}</h1>
                    {community.is_private && <Lock size={14} style={{ color: 'var(--text)' }} />}
                  </div>
                  {community.category && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>{community.category}</p>
                  )}
                  {community.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{community.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
                      <Users size={12} /> {community.member_count} members
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 mt-0.5">
                  {!isMember && !community.is_private && user && (
                    <button
                      onClick={() => join.mutate()}
                      disabled={join.isPending}
                      className="px-3 md:px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'var(--color-primary)', color: '#fff' }}
                    >
                      {join.isPending ? 'Joining…' : 'Join'}
                    </button>
                  )}
                  {isMember && !isOwner && (
                    <button
                      onClick={() => leave.mutate()}
                      disabled={leave.isPending}
                      className="px-3 md:px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ background: 'var(--color-neutral)', color: 'var(--text)' }}
                    >
                      {leave.isPending ? '…' : 'Leave'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0"
              style={tab === t.id
                ? { background: 'var(--color-primary)', color: '#fff' }
                : { color: 'var(--text)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab !== 'members' ? (
          <div className="flex flex-col gap-4">
            {/* Post composer (members only) */}
            {isMember && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                {isModOrOwner && (
                  <div className="flex gap-2">
                    {(['post', 'announcement', 'event'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setPostType(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
                        style={postType === t
                          ? { background: 'var(--color-primary)', color: '#fff' }
                          : { background: 'var(--color-neutral)', color: 'var(--text)' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder={`Write a ${postType}…`}
                  rows={2}
                  className="w-full resize-none outline-none text-sm rounded-xl px-3 py-2"
                  style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => createPost.mutate()}
                    disabled={!newPost.trim() || createPost.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                  >
                    <Send size={14} /> {createPost.isPending ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text)' }}>
                No {tab} yet
              </p>
            ) : (
              filteredPosts.map((p: CommunityPost) => (
                <CommunityPostCard
                  key={p._id}
                  post={p}
                  canDelete={isModOrOwner || p.author_id._id === user?._id}
                  onDelete={id => deletePost.mutate(id)}
                />
              ))
            )}
          </div>
        ) : (
          <MemberList
            members={members}
            canManage={isOwner}
            onUpdateRole={(userId, role) => updateRole.mutate({ userId, role })}
            onRemove={userId => removeMember.mutate(userId)}
          />
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
