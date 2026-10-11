import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.ts';
import { usePostsApi } from '../api/posts.api.ts';
import { cn } from '../../../lib/utils.ts';
import type { Post, PostReaction } from '../types.ts';

interface Props {
  post: Post;
}

/** Like / dislike / comment bar shown under a diary post. */
export function PostInteractions({ post }: Props) {
  const me = useAuthStore(s => s.user);
  const postsApi = usePostsApi();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');

  const likes = post.likes ?? [];
  const dislikes = post.dislikes ?? [];
  const comments = post.comments ?? [];
  const myId = me?._id;
  const liked = !!myId && likes.includes(myId);
  const disliked = !!myId && dislikes.includes(myId);

  /** Swap the updated post into every cached post list (diary + profile feeds). */
  function syncPost(updated: Post) {
    qc.setQueriesData<Post[]>({ queryKey: ['posts'] }, old =>
      Array.isArray(old) ? old.map(p => (p._id === updated._id ? updated : p)) : old,
    );
  }

  const reactMutation = useMutation({
    mutationFn: (reaction: PostReaction) => postsApi.react(post._id, reaction),
    onSuccess: syncPost,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => postsApi.addComment(post._id, content),
    onSuccess: updated => { syncPost(updated); setDraft(''); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => postsApi.deleteComment(post._id, commentId),
    onSuccess: syncPost,
  });

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || commentMutation.isPending) return;
    commentMutation.mutate(text);
  }

  const isPostAuthor = !!myId && post.author_id._id === myId;
  const reactionBtn =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2" role="group" aria-label="Post reactions">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? 'Remove like' : 'Like'}
          disabled={!myId || reactMutation.isPending}
          onClick={() => reactMutation.mutate(liked ? 'none' : 'like')}
          className={reactionBtn}
          style={liked
            ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
            : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text)' }}
        >
          <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
          {likes.length}
        </button>
        <button
          type="button"
          aria-pressed={disliked}
          aria-label={disliked ? 'Remove dislike' : 'Dislike'}
          disabled={!myId || reactMutation.isPending}
          onClick={() => reactMutation.mutate(disliked ? 'none' : 'dislike')}
          className={reactionBtn}
          style={disliked
            ? { backgroundColor: 'rgba(74,62,78,0.12)', color: 'var(--text-h)' }
            : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text)' }}
        >
          <ThumbsDown size={14} fill={disliked ? 'currentColor' : 'none'} />
          {dislikes.length}
        </button>
        <button
          type="button"
          aria-expanded={showComments}
          onClick={() => setShowComments(v => !v)}
          className={reactionBtn}
          style={showComments
            ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
            : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text)' }}
        >
          <MessageCircle size={14} />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {reactMutation.isError && (
        <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>Could not save your reaction. Try again.</p>
      )}

      {showComments && (
        <div className="flex flex-col gap-3">
          {comments.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text)' }}>No comments yet. Be the first!</p>
          )}
          <ul className="flex flex-col gap-2.5" role="list">
            {comments.map(c => {
              const canDelete = !!myId && (c.author_id?._id === myId || isPostAuthor);
              return (
                <li key={c._id} className="flex gap-2.5">
                  <Link to={`/${c.author_id?.username ?? ''}`} className="shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                    >
                      {c.author_id?.avatar_url
                        ? <img src={c.author_id.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (c.author_id?.display_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 rounded-xl px-3 py-2" style={{ background: 'var(--color-tertiary)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
                        {c.author_id?.display_name ?? 'Deleted user'}
                        <span className="ml-2 font-normal" style={{ color: 'var(--text)' }}>
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Delete comment"
                          disabled={deleteCommentMutation.isPending}
                          onClick={() => deleteCommentMutation.mutate(c._id)}
                          className="p-1 rounded-md hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words mt-0.5" style={{ color: 'var(--text-h)' }}>
                      {c.content}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {myId && (
            <form onSubmit={submitComment} className="flex items-center gap-2">
              <label htmlFor={`comment-${post._id}`} className="sr-only">Write a comment</label>
              <input
                id={`comment-${post._id}`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                maxLength={1000}
                placeholder="Write a comment…"
                className="flex-1 rounded-full px-4 py-2 text-sm outline-none focus-visible:ring-2"
                style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              />
              <button
                type="submit"
                aria-label="Post comment"
                disabled={!draft.trim() || commentMutation.isPending}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
                )}
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {commentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          )}
          {(commentMutation.isError || deleteCommentMutation.isError) && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>Something went wrong. Try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
