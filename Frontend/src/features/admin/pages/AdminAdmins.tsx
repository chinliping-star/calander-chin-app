import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import { useAdminApi, type AdminUser } from '../api/admin.api.ts';
import { useAuthStore } from '../../../store/auth.ts';

/** Admin → Admins: give panel access by email, or take it away. */
export function AdminAdmins() {
  const api = useAdminApi();
  const qc = useQueryClient();
  const myId = useAuthStore(s => s.user?._id);
  const [email, setEmail] = useState('');
  const [added, setAdded] = useState<string | null>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => api.listAdmins(),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const add = useMutation({
    mutationFn: () => api.addAdmin(email.trim()),
    onSuccess: (r) => { setAdded(r.username); setEmail(''); refresh(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.removeAdmin(id),
    onSuccess: refresh,
  });

  function confirmRemove(u: AdminUser) {
    if (confirm(`Remove admin access from @${u.username}? They will no longer see the admin panel.`)) remove.mutate(u._id);
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Admins</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          People who can open this panel. Add someone by the email they signed up with.
        </p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setAdded(null); if (validEmail) add.mutate(); }}
        className="flex flex-col gap-2 rounded-2xl p-4"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
          Add admin
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); add.reset(); setAdded(null); }}
            placeholder="name@example.com"
            autoComplete="off"
            className="flex-1 min-w-[220px] rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2"
            style={{ background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
          />
          <button
            type="submit"
            disabled={!validEmail || add.isPending}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50 focus-visible:outline-2"
            style={{ background: 'var(--color-primary)' }}
          >
            {add.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Make admin
          </button>
        </div>
        {add.isError && <p role="alert" className="text-xs" style={{ color: '#dc2626' }}>{(add.error as Error).message}</p>}
        {added && <p role="status" className="text-xs font-semibold" style={{ color: '#059669' }}>@{added} is now an admin.</p>}
      </form>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !admins || admins.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--text)' }}>No admins yet</p>
        ) : (
          <ul role="list">
            {admins.map(u => {
              const isMe = u._id === myId;
              const locked = u.is_owner_admin || isMe;
              return (
                <li key={u._id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="h-9 w-9 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--color-neutral)' }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <span className="flex h-full w-full items-center justify-center text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{(u.display_name || u.username)[0]}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-h)' }}>
                      <ShieldCheck size={13} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                      {u.display_name || u.username}
                      {u.is_owner_admin && (
                        <span className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}>Owner</span>
                      )}
                      {isMe && <span className="text-[10px] font-semibold" style={{ color: 'var(--text)' }}>(you)</span>}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text)' }}>{u.email || `@${u.username}`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmRemove(u)}
                    disabled={locked || remove.isPending}
                    title={u.is_owner_admin ? 'Owner admin — set in the server config (ADMIN_EMAILS)' : isMe ? "You can't remove yourself" : 'Remove admin access'}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
                  >
                    <ShieldOff size={13} aria-hidden="true" />
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {remove.isError && <p role="alert" className="text-xs" style={{ color: '#dc2626' }}>{(remove.error as Error).message}</p>}
      <p className="text-xs" style={{ color: 'var(--text)' }}>
        Owner admins come from the server's ADMIN_EMAILS setting and can only be changed there.
      </p>
    </div>
  );
}
