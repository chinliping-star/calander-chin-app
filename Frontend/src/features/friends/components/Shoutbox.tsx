import { useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../lib/utils.ts';
import { useAuthStore } from '../../../store/auth.ts';
import { useShoutboxApi } from '../api/shoutbox.api.ts';

const MAX_LEN = 150;

/** Compact relative time, e.g. "now", "5m", "3h", "2d". */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

/**
 * Shoutbox / Wallboard — shared friend feed.
 * Shows shouts from the logged-in user and their friends. Posting broadcasts
 * to your friends, so any mutual friend sees it in their own box.
 */
interface ShoutboxProps {
  /** hide the internal heading (e.g. when host provides its own title bar) */
  hideHeading?: boolean;
}

export function Shoutbox({ hideHeading = false }: ShoutboxProps) {
  const { user } = useAuthStore();
  const api = useShoutboxApi();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const queryKey = ['shoutbox-feed'];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.getFeed(),
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const postMutation = useMutation({
    mutationFn: (body: string) => api.postShout(body),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteShout(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || postMutation.isPending) return;
    postMutation.mutate(trimmed);
  }

  if (!user) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="Shoutbox">
      {!hideHeading && (
        <h3
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
          style={{ color: 'var(--text-h)' }}
        >
          <MessageCircle size={14} />
          Shoutbox
        </h3>
      )}

      {/* Messages — fixed-height scroll box, no page extension */}
      <div
        className="overflow-y-auto overflow-x-hidden rounded-xl p-2 flex flex-col gap-2"
        style={{
          border: '1px solid var(--border)',
          backgroundColor: 'var(--color-neutral)',
          height: 200,
        }}
      >
        {isLoading ? (
          <p className="text-xs m-auto" style={{ color: 'var(--text)' }}>
            Loading…
          </p>
        ) : messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-1 text-center px-3">
            <span className="text-2xl" aria-hidden="true">💬</span>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
              No shouts yet
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text)' }}>
              Be first to say hi! 👋
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const author = m.author_id;
            const canDelete = author?._id === user?._id;
            const name = author?.display_name || author?.username || 'Someone';
            const avatar =
              author?.avatar_url ||
              `https://i.pravatar.cc/100?u=${author?.username ?? m._id}`;
            return (
              <div
                key={m._id}
                className="group flex items-start gap-2 rounded-xl px-2 py-1.5"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <img
                  src={avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                  width={24}
                  height={24}
                />
                <div
                  className="flex-1 min-w-0"
                  style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[11px] font-bold truncate"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {name}
                    </span>
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: 'var(--text)' }}
                      title={new Date(m.created_at).toLocaleString()}
                    >
                      {timeAgo(m.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-snug mt-0.5"
                    style={{ color: 'var(--text-h)' }}
                  >
                    {m.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(m._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 focus-visible:opacity-100 focus-visible:outline-none mt-0.5"
                    style={{ color: 'var(--text)' }}
                    aria-label="Delete shout"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          maxLength={MAX_LEN}
          placeholder="Leave a greeting…"
          disabled={postMutation.isPending}
          className="flex-1 min-w-0 text-xs rounded-full px-3 py-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-h)',
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || postMutation.isPending}
          className={cn(
            'shrink-0 grid place-items-center w-8 h-8 rounded-full text-white transition-opacity',
            !draft.trim() || postMutation.isPending
              ? 'opacity-40'
              : 'hover:opacity-90',
          )}
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label="Send shout"
        >
          <Send size={14} />
        </button>
      </form>
      <p
        className="text-[10px] text-right tabular-nums"
        style={{
          color: draft.length > MAX_LEN - 20 ? 'var(--color-primary)' : 'var(--text)',
        }}
      >
        {draft.length}/{MAX_LEN}
      </p>
    </section>
  );
}
