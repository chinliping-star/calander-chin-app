import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostsApi } from '../api/posts.api';
import { PostCard } from './PostCard.tsx';
import type { Post } from '../types';

interface Props {
  username: string;
  isOwn: boolean;
  myId?: string;
}

export function PostFeed({ username, isOwn, myId }: Props) {
  const api = usePostsApi();
  const qc = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', username],
    queryFn: () => api.getByUsername(username),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', username] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content, privacy }: { id: string; content: string; privacy: Post['privacy'] }) =>
      api.update(id, { content, privacy }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', username] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map(i => (
          <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text)' }}>
        {isOwn ? 'No posts yet — share something!' : 'No posts to show'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post: Post) => (
        <PostCard
          key={post._id}
          post={post}
          isOwn={isOwn || post.author_id._id === myId}
          onDelete={id => deleteMutation.mutate(id)}
          onUpdate={(id, content, privacy) => updateMutation.mutate({ id, content, privacy })}
        />
      ))}
    </div>
  );
}
