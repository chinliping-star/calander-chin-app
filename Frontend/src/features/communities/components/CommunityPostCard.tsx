import { Trash2, Megaphone, CalendarDays } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CommunityPost } from '../types';
import { useActivityApi } from '../../activity/api/activity.api.ts';
import type { RsvpStatus } from '../../activity/types';

interface Props {
  post: CommunityPost;
  canDelete: boolean;
  onDelete: (postId: string) => void;
}

const TYPE_STYLES: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  announcement: { label: 'Announcement', color: 'var(--color-primary)', Icon: Megaphone },
  event:        { label: 'Event',         color: '#7c3aed',              Icon: CalendarDays },
  post:         { label: '',              color: '',                     Icon: () => null },
};

const RSVP_OPTIONS: { value: RsvpStatus; label: string; emoji: string }[] = [
  { value: 'going',      label: 'Going',      emoji: '✅' },
  { value: 'interested', label: 'Interested', emoji: '👀' },
  { value: 'not_going',  label: 'Not Going',  emoji: '❌' },
];

function RsvpBar({ postId }: { postId: string }) {
  const api = useActivityApi();
  const qc = useQueryClient();

  const { data: rsvp } = useQuery({
    queryKey: ['rsvp', postId],
    queryFn: () => api.getRsvp(postId),
    staleTime: 30_000,
  });

  const { data: myRsvp } = useQuery({
    queryKey: ['rsvp-me', postId],
    queryFn: () => api.getMyRsvp(postId),
    staleTime: 30_000,
  });

  const { mutate: upsert } = useMutation({
    mutationFn: (status: RsvpStatus) => api.upsertRsvp(postId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvp', postId] });
      qc.invalidateQueries({ queryKey: ['rsvp-me', postId] });
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: () => api.removeRsvp(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvp', postId] });
      qc.invalidateQueries({ queryKey: ['rsvp-me', postId] });
    },
  });

  const current = myRsvp?.status ?? null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {RSVP_OPTIONS.map(opt => {
        const active = current === opt.value;
        const count = rsvp?.counts[opt.value] ?? 0;
        return (
          <button
            key={opt.value}
            onClick={() => active ? remove() : upsert(opt.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: active ? '#7c3aed' : 'var(--color-neutral)',
              color: active ? '#fff' : 'var(--text)',
              border: `1px solid ${active ? '#7c3aed' : 'var(--border)'}`,
            }}
          >
            {opt.emoji} {opt.label} {count > 0 && <span className="opacity-70">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function CommunityPostCard({ post, canDelete, onDelete }: Props) {
  const style = TYPE_STYLES[post.type] ?? TYPE_STYLES.post;

  return (
    <article
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      {/* Type badge */}
      {post.type !== 'post' && (
        <div className="flex items-center gap-1.5">
          <style.Icon size={13} style={{ color: style.color }} />
          <span className="text-xs font-semibold" style={{ color: style.color }}>{style.label}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
          >
            {post.author_id.avatar_url
              ? <img src={post.author_id.avatar_url} alt="" className="w-full h-full object-cover" />
              : post.author_id.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
              {post.author_id.display_name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text)' }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(post._id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#ef4444' }}
            title="Delete post"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      {post.title && (
        <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>{post.title}</h3>
      )}
      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-h)' }}>{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="rounded-xl w-full object-cover max-h-72" />
      )}

      {/* Event details */}
      {post.type === 'event' && post.event_date && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--color-tertiary)', color: 'var(--text-h)' }}
        >
          <CalendarDays size={14} style={{ color: '#7c3aed' }} />
          <span>{format(new Date(post.event_date), 'PPP')}</span>
          {post.event_location && <span className="ml-1" style={{ color: 'var(--text)' }}>· {post.event_location}</span>}
        </div>
      )}

      {/* RSVP for events */}
      {post.type === 'event' && <RsvpBar postId={post._id} />}
    </article>
  );
}
