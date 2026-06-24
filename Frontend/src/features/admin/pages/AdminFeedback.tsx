import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, Mail } from 'lucide-react';
import { useAdminApi } from '../api/admin.api.ts';

export function AdminFeedback() {
  const api = useAdminApi();
  const qc = useQueryClient();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'feedback', { status, page }],
    queryFn: () => api.listFeedback({ status, page }),
    staleTime: 15_000,
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.resolveFeedback(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'feedback'] }),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Feedback &amp; support</h1>

      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="self-start rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="resolved">Resolved</option>
      </select>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text)' }}>No tickets</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.items.map(t => (
              <li key={t._id} className="flex items-start gap-4 px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <Mail size={16} className="mt-1 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{t.subject || '(no subject)'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{t.name} · {t.email} · {t.created_at.slice(0, 10)}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: 'var(--text-h)' }}>{t.message}</p>
                </div>
                {t.status === 'open' ? (
                  <button onClick={() => resolve.mutate(t._id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shrink-0" style={{ background: 'var(--color-primary)' }}>
                    <Check size={13} /> Resolve
                  </button>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0" style={{ background: 'rgba(52,211,153,0.15)', color: '#059669' }}>resolved</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text)' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Prev</button>
          <span>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Next</button>
        </div>
      )}
    </div>
  );
}
