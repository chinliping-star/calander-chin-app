import { User, Lock, Bell, Settings, HelpCircle, LogOut, Palette, CalendarDays } from 'lucide-react';
import { cn } from '../../../lib/utils.ts';

export type SettingsSection = 'profile' | 'appearance' | 'calendar' | 'privacy' | 'notifications' | 'account' | 'help';

interface SettingsSidebarProps {
  active: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}

const NAV_ITEMS: { key: SettingsSection; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'appearance',    label: 'Appearance',    icon: Palette },
  { key: 'calendar',      label: 'Calendar',      icon: CalendarDays },
  { key: 'privacy',       label: 'Privacy',       icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'account',       label: 'Account',       icon: Settings },
  { key: 'help',          label: 'Help Center',   icon: HelpCircle },
];

export function SettingsSidebar({ active, onSelect }: SettingsSidebarProps) {
  return (
    <aside
      className="flex flex-col rounded-2xl p-5 gap-1"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        minWidth: '180px',
      }}
      aria-label="Settings navigation"
    >
      <div className="mb-4">
        <h1 className="text-base font-bold" style={{ color: 'var(--text-h)', margin: 0, fontSize: '16px' }}>
          Settings
        </h1>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
          Manage your account & privacy
        </p>
      </div>

      <nav aria-label="Settings sections">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
                  )}
                  style={
                    isActive
                      ? { backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }
                      : { color: 'var(--text)' }
                  }
                >
                  <Icon size={15} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="my-3" style={{ borderTop: '1px solid var(--border)' }} role="separator" aria-hidden="true" />

      <button
        type="button"
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
        style={{ color: 'var(--color-primary)' }}
      >
        <LogOut size={15} />
        Logout
      </button>
    </aside>
  );
}
