import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Flag, Megaphone, ScrollText, Settings, MessageSquare, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin.ts';

const NAV = [
  { to: '/admin',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/users',        label: 'Users',         icon: Users,           end: false },
  { to: '/admin/content',      label: 'Content',       icon: FileText,        end: false },
  { to: '/admin/reports',      label: 'Reports',       icon: Flag,            end: false },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone,      end: false },
  { to: '/admin/feedback',     label: 'Feedback',      icon: MessageSquare,   end: false },
  { to: '/admin/audit',        label: 'Audit log',     icon: ScrollText,      end: false },
  { to: '/admin/settings',     label: 'Settings',      icon: Settings,        end: false },
];

export function AdminLayout() {
  const { isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-neutral)' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} size={32} />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/friends" replace />;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-neutral)' }}>
      {/* Sidebar */}
      <aside
        className="flex w-60 shrink-0 flex-col gap-1 p-4"
        style={{ background: 'var(--bg)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <ShieldAlert size={20} style={{ color: 'var(--color-primary)' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--text-h)' }}>Admin</span>
        </div>

        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              color: isActive ? 'var(--color-primary-dark)' : 'var(--text)',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => navigate('/friends')}
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft size={16} />
          Back to app
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
