import { Monitor, Smartphone, Loader2, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser, useAuth } from '@clerk/clerk-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Lists every device signed in to this account (from Clerk) and lets the
 * user sign out any device except the one they are using right now.
 */
export function ActiveSessions() {
  const { user } = useUser();
  const { sessionId } = useAuth();
  const qc = useQueryClient();

  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: ['clerk-sessions', user?.id],
    queryFn: async () => {
      const all = await user!.getSessions();
      // Current device first, then most recently active.
      return all
        .filter(s => s.status === 'active')
        .sort((a, b) => {
          if (a.id === sessionId) return -1;
          if (b.id === sessionId) return 1;
          return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
        });
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const target = sessions.find(s => s.id === id);
      if (target) await target.revoke();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['clerk-sessions'] }),
  });

  const revokeAll = useMutation({
    mutationFn: async () => {
      await Promise.all(sessions.filter(s => s.id !== sessionId).map(s => s.revoke()));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['clerk-sessions'] }),
  });

  const others = sessions.filter(s => s.id !== sessionId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: 'var(--text)', margin: 0 }}>
          Devices signed in to your account.
        </p>
        {others.length > 0 && (
          <button
            type="button"
            onClick={() => revokeAll.mutate()}
            disabled={revokeAll.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-neutral)', color: '#dc2626', border: '1px solid var(--border)' }}
          >
            {revokeAll.isPending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
            Sign out all other devices
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}
      {isError && (
        <p className="text-sm" role="alert" style={{ color: '#dc2626' }}>Could not load your devices. Refresh to try again.</p>
      )}

      <ul className="flex flex-col gap-2" role="list">
        {sessions.map(s => {
          const a = s.latestActivity;
          const isCurrent = s.id === sessionId;
          const Icon = a?.isMobile ? Smartphone : Monitor;
          const browser = [a?.browserName, a?.browserVersion].filter(Boolean).join(' ') || 'Unknown browser';
          const device = a?.deviceType || (a?.isMobile ? 'Mobile' : 'Computer');
          const place = [a?.city, a?.country].filter(Boolean).join(', ');
          const busy = revoke.isPending && revoke.variables === s.id;
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--color-neutral)', border: isCurrent ? '1.5px solid var(--color-primary-light)' : '1px solid var(--border)' }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
                aria-hidden="true"
              >
                <Icon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)', margin: 0 }}>
                  {device} · {browser}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full align-middle"
                      style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text)', margin: 0 }}>
                  {[place, a?.ipAddress].filter(Boolean).join(' · ')}
                  {(place || a?.ipAddress) && ' · '}
                  Active {formatDistanceToNow(new Date(s.lastActiveAt), { addSuffix: true })}
                </p>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => revoke.mutate(s.id)}
                  disabled={busy || revokeAll.isPending}
                  aria-label={`Sign out ${device} ${browser}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  style={{ backgroundColor: 'var(--bg)', color: '#dc2626', border: '1px solid var(--border)' }}
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : null}
                  Sign out
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {(revoke.isError || revokeAll.isError) && (
        <p className="text-sm" role="alert" style={{ color: '#dc2626' }}>Could not sign out that device. Try again.</p>
      )}
    </div>
  );
}
