import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings } from '../ui/Icon.tsx';
import {
  MessageSquare, LogOut, User, CalendarDays, Users, Camera,
  BookOpen, BarChart2, Activity as ActivityIcon, DollarSign,
  MoreHorizontal, X, ShieldAlert,
} from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { useIsAdmin } from '../../features/admin/hooks/useIsAdmin.ts';
import { Logo } from '../Logo.tsx';
import { useAuthStore } from '../../store/auth.ts';
import { useClerk } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useChatApi } from '../../features/chat/api/chat.api.ts';
import { useNotificationsApi } from '../../features/notifications/api/notifications.api.ts';
import { NotificationPanel } from '../../features/notifications/components/NotificationPanel.tsx';

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { signOut } = useClerk();
  const chatApi = useChatApi();
  const notifApi = useNotificationsApi();
  const { isAdmin } = useIsAdmin();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    if (avatarMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [avatarMenuOpen]);

  async function handleLogout() {
    setAvatarMenuOpen(false);
    setMoreOpen(false);
    clearAuth();
    await signOut();
    navigate('/login');
  }

  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => chatApi.getUnreadCount(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  const { data: notifUnread } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => notifApi.getUnread(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
  const notifCount = notifUnread?.count ?? 0;

  const NAV_LINKS = [
    { label: 'My Calendar', href: user ? `/${user.username}/calendar` : '/login' },
    { label: 'Friends',     href: '/friends' },
    { label: 'Memories',    href: '/memory' },
    { label: 'Diary',       href: '/diary' },
    { label: 'Pricing',     href: '/pricing' },
    { label: 'Chat',        href: '/chat' },
    { label: 'Analytics',   href: '/analytics' },
    { label: 'Activity',    href: '/activity' },
  ];

  // Mobile bottom nav — primary 4 tabs
  const MOBILE_PRIMARY = [
    { label: 'Calendar', href: user ? `/${user.username}/calendar` : '/login', Icon: CalendarDays, badge: 0 },
    { label: 'Friends',  href: '/friends',  Icon: Users, badge: 0 },
    { label: 'Memories', href: '/memory',   Icon: Camera, badge: 0 },
    { label: 'Chat',     href: '/chat',     Icon: MessageSquare, badge: unreadCount },
  ];

  // Items in "More" drawer
  const MOBILE_MORE_LINKS = [
    { label: 'Diary',     href: '/diary',      Icon: BookOpen },
    { label: 'Analytics', href: '/analytics',  Icon: BarChart2 },
    { label: 'Activity',  href: '/activity',   Icon: ActivityIcon },
    { label: 'Pricing',   href: '/pricing',    Icon: DollarSign },
    { label: 'Settings',  href: '/settings',   Icon: Settings },
    { label: 'Profile',   href: user ? `/${user.username}` : '/login', Icon: User },
  ];

  function isActive(href: string) {
    return pathname === href || (href !== '/login' && pathname.startsWith(href) && href !== '/');
  }

  return (
    <>
      {/* ── Desktop top header ── */}
      <header
        className="sticky top-0 z-50 w-full border-b hidden md:block"
        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex  h-16 max-w-screen-xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Logo className="mt-4" to={user ? `/${user.username}/calendar` : '/login'} size={90} showText={false} />

          {/* Center nav */}
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-6" role="list">
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      to={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative text-sm font-medium pb-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 rounded-sm',
                        active ? 'border-b-2' : 'hover:opacity-80',
                      )}
                      style={{
                        textDecoration: 'none',
                        ...(active
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
            {/* Chat icon */}
            <Link
              to="/chat"
              aria-label="Chat"
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: 'var(--color-secondary)', backgroundColor: 'var(--color-neutral)' }}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen(o => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                style={{ color: 'var(--color-secondary)', backgroundColor: notifOpen ? 'var(--accent-bg)' : 'var(--color-neutral)' }}
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </div>

            <Link
              to="/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: 'var(--color-secondary)', backgroundColor: 'var(--color-neutral)' }}
            >
              <Settings size={18} />
            </Link>

            {/* Avatar with dropdown */}
            <div className="relative" ref={avatarMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={avatarMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAvatarMenuOpen(v => !v)}
                className="h-12 w-12 overflow-hidden rounded-full border-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: 'var(--color-primary)' }}
              >
                <img
                  src={user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.username}`}
                  alt={user?.display_name || user?.username || 'User'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={48}
                  height={48}
                />
              </button>

              {avatarMenuOpen && (
                <div
                  className="absolute right-0 top-14 w-44 rounded-xl py-1 z-50"
                  role="menu"
                  aria-label="Account options"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(74,62,78,0.15)',
                  }}
                >
                  {user && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setAvatarMenuOpen(false); navigate(`/${user.username}`); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm hover:opacity-70 transition-opacity focus-visible:outline-none"
                      style={{ color: 'var(--text-h)' }}
                    >
                      <User size={14} />
                      View Profile
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setAvatarMenuOpen(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm hover:opacity-70 transition-opacity focus-visible:outline-none"
                    style={{ color: 'var(--text-h)' }}
                  >
                    <Settings size={14} />
                    Settings
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setAvatarMenuOpen(false); navigate('/admin'); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm hover:opacity-70 transition-opacity focus-visible:outline-none"
                      style={{ color: 'var(--color-primary-dark)' }}
                    >
                      <ShieldAlert size={14} />
                      Admin Panel
                    </button>
                  )}
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm hover:opacity-70 transition-opacity focus-visible:outline-none"
                    style={{ color: '#e11d48' }}
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Mobile navigation"
      >
        <div
          className="mx-3 mb-3 rounded-2xl"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 -2px 24px rgba(74,62,78,0.12)',
          }}
        >
          <div className="flex items-center justify-around py-1">
            {MOBILE_PRIMARY.map(({ label, href, Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="relative flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    <Icon
                      size={20}
                      style={{ color: active ? '#ffffff' : 'var(--text)' }}
                    />
                    {badge > 0 && (
                      <span
                        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                        style={{ backgroundColor: '#e11d48' }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{ color: active ? 'var(--color-primary)' : 'var(--text)' }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              type="button"
              aria-label="More navigation options"
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
            >
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{ width: 40, height: 40, backgroundColor: 'transparent' }}
              >
                <MoreHorizontal size={20} style={{ color: 'var(--text)' }} />
              </div>
              <span className="text-[10px] font-medium leading-none" style={{ color: 'var(--text)' }}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── More drawer (mobile) ── */}
      {createPortal(
        <AnimatePresence>
          {moreOpen && (
          <>
          {/* Backdrop */}
          <motion.div
            key="more-backdrop"
            className="fixed inset-0 z-[9980]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <motion.div
            key="more-sheet"
            className="fixed left-0 right-0 bottom-0 z-[9981] rounded-t-3xl pb-8"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 -8px 32px rgba(74,62,78,0.18)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            {/* Close button */}
            <div className="flex items-center justify-between px-5 mb-4">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>More</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid of links */}
            <div className="grid grid-cols-3 gap-3 px-5">
              {MOBILE_MORE_LINKS.map(({ label, href, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    to={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
                    style={{
                      textDecoration: 'none',
                      backgroundColor: active ? 'var(--accent-bg)' : 'var(--color-neutral)',
                      border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: active ? 'var(--color-primary)' : 'var(--text)', display: 'flex' }}>
                      <Icon size={22} />
                    </span>
                    <span
                      className="text-[11px] font-medium text-center leading-tight"
                      style={{ color: active ? 'var(--color-primary)' : 'var(--text-h)' }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Notifications + logout row */}
            <div className="flex items-center gap-3 px-5 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => { setMoreOpen(false); setNotifOpen(true); }}
                className="flex flex-1 items-center gap-2 rounded-2xl py-3 px-4"
                style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
              >
                <Bell size={18} />
                <span className="text-sm font-medium">Notifications</span>
                {notifCount > 0 && (
                  <span
                    className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl py-3 px-4"
                style={{ backgroundColor: '#fef2f2', color: '#e11d48' }}
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
          </>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Notification panel (mobile) — portal so it's above everything */}
      {notifOpen && (
        <div className="md:hidden">
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        </div>
      )}
    </>
  );
}
