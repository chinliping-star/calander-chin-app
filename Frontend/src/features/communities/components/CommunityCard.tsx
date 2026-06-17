import { Link } from 'react-router-dom';
import { Lock, Users } from 'lucide-react';
import type { Community } from '../types';

interface Props {
  community: Community;
  onJoin?: (id: string) => void;
  joining?: boolean;
  isMember?: boolean;
}

export function CommunityCard({ community, onJoin, joining, isMember }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      {/* Banner / avatar area */}
      <div
        className="h-16 relative flex-shrink-0"
        style={{ background: community.banner_url ? undefined : 'var(--color-primary-light)' }}
      >
        {community.banner_url && (
          <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div
          className="absolute -bottom-5 left-4 w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold overflow-hidden"
          style={{ background: 'var(--color-primary)', color: '#fff', border: '2px solid var(--bg)' }}
        >
          {community.avatar_url
            ? <img src={community.avatar_url} alt="" className="w-full h-full object-cover" />
            : community.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="pt-7 px-4 pb-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/communities/${community.slug}`}
              className="font-bold text-sm hover:underline"
              style={{ color: 'var(--text-h)', textDecoration: 'none' }}
            >
              {community.name}
            </Link>
            {community.is_private && (
              <Lock size={11} className="inline ml-1" style={{ color: 'var(--text)' }} />
            )}
            {community.category && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>
                {community.category}
              </p>
            )}
          </div>
        </div>

        {community.description && (
          <p className="text-xs line-clamp-2 flex-1" style={{ color: 'var(--text)' }}>
            {community.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
            <Users size={12} /> {community.member_count}
          </span>
          {onJoin && !isMember && !community.is_private && (
            <button
              onClick={() => onJoin(community._id)}
              disabled={joining}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {joining ? '…' : 'Join'}
            </button>
          )}
          {isMember && (
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}>
              Joined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
