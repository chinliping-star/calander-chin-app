import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Plus, Trash2, Check } from 'lucide-react';
import { useAdminApi, type SettingsPayload } from '../api/admin.api.ts';

const field = 'rounded-lg px-3 py-2 text-sm outline-none w-full';
const fieldStyle = { background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' } as const;

export function AdminSettings() {
  const api = useAdminApi();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.getSettings(),
    staleTime: 30_000,
  });

  const [form, setForm] = useState<SettingsPayload>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [newFlag, setNewFlag] = useState('');

  useEffect(() => {
    if (data) {
      setForm({ app_name: data.app_name, maintenance_mode: data.maintenance_mode, maintenance_message: data.maintenance_message });
      setFlags(data.feature_flags ?? {});
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.updateSettings({ ...form, feature_flags: flags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['settings', 'public'] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Platform settings</h1>

      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
          App name
          <input className={field} style={fieldStyle} value={form.app_name ?? ''} onChange={e => setForm(f => ({ ...f, app_name: e.target.value }))} />
        </label>

        <label className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
          <input type="checkbox" checked={!!form.maintenance_mode} onChange={e => setForm(f => ({ ...f, maintenance_mode: e.target.checked }))} />
          Maintenance mode (non-admins see a notice)
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
          Maintenance message
          <textarea className={field} style={fieldStyle} rows={2} value={form.maintenance_message ?? ''} onChange={e => setForm(f => ({ ...f, maintenance_message: e.target.value }))} />
        </label>
      </div>

      {/* Feature flags */}
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>Feature flags</p>
        {Object.keys(flags).length === 0 && <p className="text-xs" style={{ color: 'var(--text)' }}>No flags yet</p>}
        {Object.entries(flags).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="flex-1 text-sm font-mono" style={{ color: 'var(--text-h)' }}>{key}</span>
            <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
              <input type="checkbox" checked={val} onChange={e => setFlags(f => ({ ...f, [key]: e.target.checked }))} /> on
            </label>
            <button onClick={() => setFlags(f => { const c = { ...f }; delete c[key]; return c; })} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className={field} style={fieldStyle} placeholder="new_flag_key" value={newFlag} onChange={e => setNewFlag(e.target.value)} />
          <button
            onClick={() => { const k = newFlag.trim(); if (k) { setFlags(f => ({ ...f, [k]: false })); setNewFlag(''); } }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold shrink-0" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary-dark)' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="self-start flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: 'var(--color-primary)' }}
      >
        {save.isPending ? <Loader2 size={15} className="animate-spin" /> : save.isSuccess ? <Check size={15} /> : <Save size={15} />}
        {save.isSuccess ? 'Saved' : 'Save settings'}
      </button>
    </div>
  );
}
