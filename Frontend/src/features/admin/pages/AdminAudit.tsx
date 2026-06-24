import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAdminApi } from '../api/admin.api.ts';

const METHOD_TINT: Record<string, string> = {
  POST: '#059669', PATCH: '#2563eb', PUT: '#2563eb', DELETE: '#dc2626',
};

export function AdminAudit() {
  const api = useAdminApi();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', { page }],
    queryFn: () => api.listAudit({ page }),
    staleTime: 10_000,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Audit log</h1>
      <p className="text-sm" style={{ color: 'var(--text)' }}>Every admin action — who, what, when.</p>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text)' }}>No activity logged yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                <th className="text-left font-semibold px-4 py-3">Admin</th>
                <th className="text-left font-semibold px-4 py-3">Action</th>
                <th className="text-left font-semibold px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(l => (
                <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text-h)' }}>@{l.actor_username || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-bold mr-2" style={{ color: METHOD_TINT[l.method] ?? 'var(--text)' }}>{l.method}</span>
                    <span style={{ color: 'var(--text)' }}>{l.path}</span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{new Date(l.created_at).toLocaleString()}</td>
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
    </div>
  );
}
