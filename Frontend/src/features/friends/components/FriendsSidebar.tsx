import { Users, Mail, Calendar, Archive, HelpCircle, LogOut, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils.ts';
import type { SidebarSection } from '../types.ts';

interface FriendsSidebarProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
}

const NAV_ITEMS: {
  key: SidebarSection;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: number;
}[] = [
  { key: 'all', label: 'All Friends', icon: Users },
  { key: 'invites', label: 'Invites', icon: Mail, badge: 7 },
  { key: 'past', label: 'Past Meetups', icon: Calendar },
  { key: 'archived', label: 'Archived', icon: Archive },
];

export function FriendsSidebar({ active, onSelect }: FriendsSidebarProps) {
  const navigate = useNavigate();
  return (
    <aside
      className="flex flex-col h-full rounded-2xl p-5 gap-2"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        minHeight: '520px',
      }}
      aria-label="Friends navigation"
    >
      {/* Profile header */}
      <div className="mb-4">
        <p className="font-bold text-base" style={{ color: 'var(--text-h)' }}>
          Alex Johnson
        </p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>
          12 Upcoming Meetups
        </p>
      </div>

      {/* Nav items */}
      <nav aria-label="Friends sections">
        <ul className="flex flex-col gap-1" role="list">
          {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => {
            const isActive = active === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
                    isActive ? 'text-white' : 'hover:opacity-80',
                  )}
                  style={
                    isActive
                      ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
                      : { color: 'var(--text)' }
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {label}
                  </span>
                  {badge !== undefined && (
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: 'var(--color-primary)' }}
                      aria-label={`${badge} ${label}`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => navigate('/settings?section=help')}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'var(--text)' }}
        >
          <HelpCircle size={16} />
          Help Center
        </button>
        <button
          type="button"
          className="flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'var(--color-primary)' }}
        >
          <LogOut size={16} />
          Logout
        </button>

        {/* Add friend button — below divider */}
        <button
          type="button"
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <UserPlus size={15} />
          + Add Friend
        </button>
      </div>
    </aside>
  );
}
