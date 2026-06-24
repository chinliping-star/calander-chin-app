import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Trash2, RotateCcw, Shield, X, Check, Download } from 'lucide-react';
import { useAdminApi, type AdminUser, type ModerateUserPayload } from '../api/admin.api.ts';

const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  active:    { bg: 'rgba(52,211,153,0.15)', fg: '#059669' },
  suspended: { bg: 'rgba(251,191,36,0.18)', fg: '#b45309' },
  blocked:   { bg: 'rgba(239,68,68,0.12)',  fg: '#dc2626' },
};

function StatusBadge({ status }: { status: string }) {
  const t = STATUS_TINT[status] ?? STATUS_TINT.active;
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: t.bg, color: t.fg }}>
      {status}
    </span>
  );
}

function ModerateModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const api = useAdminApi();
  const qc = useQueryClient();
  const [form, setForm] = useState<ModerateUserPayload>({
    status: user.status,
    role: user.role,
    is_premium: user.is_premium,
    is_admin: user.is_admin,
    moderation_reason: user.moderation_reason ?? '',
  });

  const save = useMutation({
    mutationFn: () => api.moderateUser(user._id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const field = 'rounded-lg px-3 py-2 text-sm outline-none w-full';
  const fieldStyle = { background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' } as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(15,10,20,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>Moderate @{user.username}</h3>
          <button onClick={onClose} style={{ color: 'var(--text)' }}><X size={18} /></button>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
          Status
          <select className={field} style={fieldStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ModerateUserPayload['status'] }))}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
          Role
          <select className={field} style={fieldStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as ModerateUserPayload['role'] }))}>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
          Reason / note
          <textarea className={field} style={fieldStyle} rows={2} value={form.moderation_reason} onChange={e => setForm(f => ({ ...f, moderation_reason: e.target.value }))} />
        </label>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-h)' }}>
            <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} />
            Premium
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-h)' }}>
            <input type="checkbox" checked={form.is_admin} onChange={e => setForm(f => ({ ...f, is_admin: e.target.checked }))} />
            Admin
          </label>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Save changes
        </button>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const api = useAdminApi();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, status, page }],
    queryFn: () => api.listUsers({ search, status, page }),
    staleTime: 15_000,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const restore = useMutation({
    mutationFn: (id: string) => api.restoreUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Users</h1>
        <button onClick={() => api.exportUsersCsv()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, username"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-h)' }}
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text)' }}>No users found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                <th className="text-left font-semibold px-4 py-3">User</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Role</th>
                <th className="text-left font-semibold px-4 py-3">Joined</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--color-neutral)' }}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                          : <span className="flex h-full w-full items-center justify-center text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{u.display_name?.[0] ?? u.username[0]}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                          {u.display_name || u.username}
                          {u.is_premium && <span className="text-[9px] font-bold" style={{ color: 'var(--color-primary)' }}>★</span>}
                          {u.is_admin && <Shield size={11} style={{ color: 'var(--color-primary)' }} />}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text)' }}>{u.email || `@${u.username}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.deleted_at ? 'blocked' : u.status} /></td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{u.role}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{u.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(u)} className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary-dark)' }}>
                        Moderate
                      </button>
                      {u.deleted_at ? (
                        <button onClick={() => restore.mutate(u._id)} title="Restore" className="rounded-lg p-1.5" style={{ color: '#059669' }}><RotateCcw size={15} /></button>
                      ) : (
                        <button onClick={() => { if (confirm(`Delete @${u.username}? (soft delete)`)) del.mutate(u._id); }} title="Delete" className="rounded-lg p-1.5" style={{ color: '#dc2626' }}><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text)' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Prev</button>
          <span>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Next</button>
        </div>
      )}

      {editing && <ModerateModal user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
