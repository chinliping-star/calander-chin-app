import { Link } from 'react-router-dom';
import type { Activity } from '../types';

const TYPE_LABELS: Record<Activity['type'], string> = {
  meetup_accepted:   'accepted a meetup',
  friend_added:      'made a new friend',
  community_joined:  'joined a community',
  community_created: 'created a community',
  post_created:      'shared a post',
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function ActivityItem({ activity }: { activity: Activity }) {
  const { actor, type, meta, created_at } = activity;
  const label = TYPE_LABELS[type] ?? type.replace(/_/g, ' ');

  return (
    <div className="flex items-start gap-3 py-3">
      <Link to={`/${actor.username}`}>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--color-neutral)' }}>
          {actor.avatar_url
            ? <img src={actor.avatar_url} alt={actor.display_name} className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{actor.display_name[0]}</span>
          }
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-h)' }}>
          <Link to={`/${actor.username}`} style={{ fontWeight: 700, color: 'var(--text-h)', textDecoration: 'none' }}>
            {actor.display_name}
          </Link>
          {' '}{label}
          {meta?.title && (
            <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}> "{meta.title}"</span>
          )}
          {meta?.slug && (
            <Link to={`/communities/${meta.slug}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              {' '}{meta.name ?? meta.slug}
            </Link>
          )}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{timeAgo(created_at)}</p>
      </div>
    </div>
  );
}
