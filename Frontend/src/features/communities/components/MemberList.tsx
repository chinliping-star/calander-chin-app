import { Crown, Shield, User } from 'lucide-react';
import type { CommunityMember } from '../types';

const ROLE_ICON: Record<string, React.ElementType> = {
  owner:     Crown,
  moderator: Shield,
  member:    User,
};
const ROLE_COLOR: Record<string, string> = {
  owner:     'var(--color-primary)',
  moderator: '#7c3aed',
  member:    'var(--text)',
};

interface Props {
  members: CommunityMember[];
  canManage: boolean;
  onUpdateRole?: (userId: string, role: 'moderator' | 'member') => void;
  onRemove?: (userId: string) => void;
}

export function MemberList({ members, canManage, onUpdateRole, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {members.map(m => {
        const Icon = ROLE_ICON[m.role] ?? User;
        return (
          <div
            key={m._id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--color-neutral)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
            >
              {m.user_id.avatar_url
                ? <img src={m.user_id.avatar_url} alt="" className="w-full h-full object-cover" />
                : m.user_id.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                {m.user_id.display_name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text)' }}>@{m.user_id.username}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Icon size={13} style={{ color: ROLE_COLOR[m.role] }} />
              <span className="text-xs capitalize font-medium" style={{ color: ROLE_COLOR[m.role] }}>
                {m.role}
              </span>
            </div>
            {canManage && m.role !== 'owner' && (
              <div className="flex gap-1">
                {m.role === 'member' && (
                  <button
                    onClick={() => onUpdateRole?.(m.user_id._id, 'moderator')}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                  >
                    Promote
                  </button>
                )}
                {m.role === 'moderator' && (
                  <button
                    onClick={() => onUpdateRole?.(m.user_id._id, 'member')}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--color-neutral)', color: 'var(--text)' }}
                  >
                    Demote
                  </button>
                )}
                <button
                  onClick={() => onRemove?.(m.user_id._id)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: '#ef4444', background: 'var(--color-neutral)' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
