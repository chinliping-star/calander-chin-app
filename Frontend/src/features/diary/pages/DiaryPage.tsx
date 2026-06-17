import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { useAuthStore } from '../../../store/auth.ts';
import { usePostsApi } from '../../posts/api/posts.api.ts';
import { PostCard } from '../../posts/components/PostCard.tsx';
import { NewPostModal } from '../../posts/components/NewPostModal.tsx';
import { cn } from '../../../lib/utils.ts';
import type { Post, PostPrivacy } from '../../posts/types.ts';

type FilterValue = 'all' | PostPrivacy;

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'public',  label: 'Public' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'private', label: 'Private' },
];

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl text-5xl"
        style={{ backgroundColor: 'var(--accent-bg)' }}
      >
        📖
      </div>
      <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
        No memories yet.
      </h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        Start your first diary entry and capture the little moments that matter most.
      </p>
      <button
        onClick={onNew}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        ✍️ Write First Memory
      </button>
    </div>
  );
}

export function DiaryPage() {
  const user = useAuthStore(s => s.user);
  const postsApi = usePostsApi();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [showModal, setShowModal] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', user?.username],
    queryFn: () => postsApi.getByUsername(user!.username),
    enabled: !!user?.username,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof postsApi.create>[0]) => postsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts', user?.username] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', user?.username] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content, privacy }: { id: string; content: string; privacy: Post['privacy'] }) =>
      postsApi.update(id, { content, privacy }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', user?.username] }),
  });

  const filtered = filter === 'all'
    ? posts
    : posts.filter((p: Post) => p.privacy === filter);

  // Group by month
  const grouped: { month: string; items: Post[] }[] = [];
  for (const post of filtered) {
    const month = getMonthLabel(post.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.month === month) last.items.push(post);
    else grouped.push({ month, items: [post] });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold italic"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}
            >
              FriendDiary
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text)' }}>Your personal memory journal</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={16} />
            New Entry
          </button>
        </div>

        {/* Filter pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTER_PILLS.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:opacity-80')}
                style={{
                  borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                  backgroundColor: active ? 'var(--color-primary)' : 'var(--bg)',
                  color: active ? '#ffffff' : 'var(--text)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => setShowModal(true)} />
        ) : (
          <div className="flex flex-col gap-0">
            {grouped.map(({ month, items }) => (
              <section key={month}>
                {/* Month separator */}
                <div className="relative mb-4 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                  <span
                    className="rounded-full border px-3 py-0.5 text-xs font-semibold"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--color-tertiary)', color: 'var(--text)' }}
                  >
                    {month}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                </div>

                <div className="mb-8 flex flex-col gap-4">
                  {items.map((post: Post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      isOwn
                      onDelete={id => deleteMutation.mutate(id)}
                      onUpdate={(id, content, privacy) => updateMutation.mutate({ id, content, privacy })}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewPostModal
          onClose={() => setShowModal(false)}
          onSubmit={data => createMutation.mutate(data)}
          submitting={createMutation.isPending}
        />
      )}
    </AppShell>
  );
}
