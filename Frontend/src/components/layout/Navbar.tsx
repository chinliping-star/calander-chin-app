import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings } from '../ui/Icon.tsx';
import { cn } from '../../lib/utils.ts';

const NAV_LINKS = [
  { label: 'My Calendar', href: '/' },
  { label: 'Friends',     href: '/friends' },
  { label: 'Diary',       href: '/diary' },
  { label: 'Pricing',     href: '/pricing' },
];

export function Navbar() {
  const { pathname } = useLocation();
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold italic tracking-tight focus-visible:outline-none focus-visible:ring-2 rounded"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--heading)', textDecoration: 'none' }}
          aria-label="Friendiary home"
        >
          Friendiary
        </Link>

        {/* Center nav */}
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6" role="list">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href || (href === '/' && pathname === '/');
              return (
                <li key={href}>
                  <Link
                    to={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative text-sm font-medium pb-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 rounded-sm',
                      isActive ? 'border-b-2' : 'hover:opacity-80',
                    )}
                    style={{
                      textDecoration: 'none',
                      ...(isActive
                        ? { color: 'var(--text-h)', borderColor: 'var(--color-primary)' }
                        : { color: 'var(--text)' }),
                    }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'var(--color-secondary)', backgroundColor: 'var(--color-neutral)' }}
          >
            <Bell size={18} />
            {/* Notification dot */}
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-hidden="true"
            />
          </button>

          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'var(--color-secondary)', backgroundColor: 'var(--color-neutral)' }}
          >
            <Settings size={18} />
          </Link>

          {/* Avatar */}
          <button
            type="button"
            aria-label="Account menu"
            className="h-12 w-12 overflow-hidden rounded-full border-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: 'var(--color-primary)' }}
          >
            <img
              src="https://i.pravatar.cc/150?img=3"
              alt="Muneb"
              className="h-full w-full object-cover"
              loading="lazy"
              width={48}
              height={48}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
