import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Megaphone, Trash2, Pin, PinOff, Plus } from 'lucide-react';
import { useAnnouncementsApi, type AnnouncementPayload } from '../../announcements/api/announcements.api.ts';

const field = 'rounded-lg px-3 py-2 text-sm outline-none w-full';
const fieldStyle = { background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' } as const;

const EMPTY: AnnouncementPayload = { title: '', body: '', priority: 'normal', audience: 'all', is_pinned: false };

export function AdminAnnouncements() {
  const api = useAnnouncementsApi();
  const qc = useQueryClient();
  const [form, setForm] = useState<AnnouncementPayload>(EMPTY);

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: () => api.list(),
    staleTime: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    qc.invalidateQueries({ queryKey: ['announcements', 'active'] });
  };

  const create = useMutation({
    mutationFn: () => api.create(form),
    onSuccess: () => { setForm(EMPTY); invalidate(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: invalidate,
  });
  const togglePin = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => api.update(id, { is_pinned: pinned }),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Announcements</h1>

      {/* Create form */}
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}><Megaphone size={15} /> New announcement</p>
        <input className={field} style={fieldStyle} placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className={field} style={fieldStyle} rows={3} placeholder="Message body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
            Priority
            <select className={field} style={fieldStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as AnnouncementPayload['priority'] }))}>
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
            Audience
            <select className={field} style={fieldStyle} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value as AnnouncementPayload['audience'] }))}>
              <option value="all">Everyone</option><option value="premium">Premium</option><option value="admins">Admins</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
            Publish at (optional)
            <input type="datetime-local" className={field} style={fieldStyle} onChange={e => setForm(f => ({ ...f, publish_at: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
            Expires at (optional)
            <input type="datetime-local" className={field} style={fieldStyle} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-h)' }}>
          <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} /> Pin to top
        </label>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !form.title.trim() || !form.body.trim()}
          className="self-start flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Publish
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : data.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--text)' }}>No announcements yet</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.map(a => (
              <li key={a._id} className="flex items-start gap-3 px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                    {a.is_pinned && <Pin size={12} style={{ color: 'var(--color-primary)' }} />}
                    {a.title}
                    <span className="text-[10px] font-bold uppercase rounded-full px-1.5 py-0.5" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary-dark)' }}>{a.priority}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text)' }}>· {a.audience}</span>
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text)' }}>{a.body}</p>
                </div>
                <button onClick={() => togglePin.mutate({ id: a._id, pinned: !a.is_pinned })} title={a.is_pinned ? 'Unpin' : 'Pin'} className="p-1.5 rounded-lg" style={{ color: 'var(--text)' }}>
                  {a.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                </button>
                <button onClick={() => { if (confirm('Delete announcement?')) remove.mutate(a._id); }} title="Delete" className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
