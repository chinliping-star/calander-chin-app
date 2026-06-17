import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, CalendarCheck, CalendarX, Users, MessageSquare, Bell, CheckCheck } from 'lucide-react';
import { useNotificationsApi } from '../api/notifications.api.ts';
import type { Notification, NotificationType } from '../types';

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  friend_request:    UserPlus,
  friend_accepted:   UserPlus,
  meetup_proposed:   CalendarCheck,
  meetup_accepted:   CalendarCheck,
  meetup_declined:   CalendarX,
  community_invite:  Users,
  community_post:    Users,
  message_received:  MessageSquare,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  friend_request:   'var(--color-primary)',
  friend_accepted:  '#22c55e',
  meetup_proposed:  '#7c3aed',
  meetup_accepted:  '#22c55e',
  meetup_declined:  '#ef4444',
  community_invite: 'var(--color-primary)',
  community_post:   '#f59e0b',
  message_received: '#3b82f6',
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Props {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const api = useNotificationsApi();
  const qc = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getAll(),
    staleTime: 30_000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onMutate: (id) => {
      qc.setQueryData<Notification[]>(['notifications'], old =>
        (old ?? []).map(n => n._id === id ? { ...n, is_read: true } : n),
      );
      qc.setQueryData<{ count: number }>(['notif-unread'], old => ({
        count: Math.max(0, (old?.count ?? 1) - 1),
      }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-unread'] });
    },
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.markAllRead(),
    onMutate: () => {
      qc.setQueryData<Notification[]>(['notifications'], old =>
        (old ?? []).map(n => ({ ...n, is_read: true })),
      );
      qc.setQueryData<{ count: number }>(['notif-unread'], { count: 0 });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notif-unread'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 max-h-[480px] flex flex-col rounded-2xl shadow-xl overflow-hidden z-50"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(74,62,78,0.18)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Notifications</h3>
          {unread > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary)', color: '#fff' }}>
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAll()}
            className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2 animate-pulse">
                <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'var(--color-neutral)' }} />
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  <div className="h-3 rounded-md" style={{ background: 'var(--color-neutral)', width: '80%' }} />
                  <div className="h-2.5 rounded-md" style={{ background: 'var(--color-neutral)', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Bell size={28} style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text)' }}>No notifications yet</p>
          </div>
        ) : (
          notifs.map((n: Notification) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const color = TYPE_COLOR[n.type] ?? 'var(--color-primary)';
            return (
              <button
                key={n._id}
                onClick={() => !n.is_read && markRead(n._id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:opacity-90 border-b"
                style={{
                  background: n.is_read ? 'transparent' : 'var(--accent-bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  {n.actor_id?.avatar_url
                    ? <img src={n.actor_id.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    : <Icon size={16} style={{ color }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-h)' }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text)' }}>{n.body}</p>}
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text)' }}>{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--color-primary)' }} />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
