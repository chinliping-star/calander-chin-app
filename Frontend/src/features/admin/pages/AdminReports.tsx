import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Flag, Download, Check, X } from 'lucide-react';
import { useAdminApi, type AdminReport, type ResolveReportPayload } from '../api/admin.api.ts';

const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: 'rgba(251,191,36,0.18)', fg: '#b45309' },
  reviewing: { bg: 'rgba(96,165,250,0.18)', fg: '#2563eb' },
  resolved:  { bg: 'rgba(52,211,153,0.15)', fg: '#059669' },
  dismissed: { bg: 'var(--color-neutral)',  fg: 'var(--text)' },
};

const ACTIONS: { value: NonNullable<ResolveReportPayload['action']>; label: string }[] = [
  { value: 'none',           label: 'No action' },
  { value: 'warn',           label: 'Warn' },
  { value: 'remove_content', label: 'Remove content' },
  { value: 'suspend_user',   label: 'Suspend user' },
  { value: 'block_user',     label: 'Block user' },
];

function targetLabel(r: AdminReport): string {
  const t = r.target_id as Record<string, any> | undefined;
  if (!t) return '(deleted)';
  if (r.target_type === 'user') return `@${t.username ?? t._id}`;
  return t.title || (typeof t.content === 'string' ? t.content.slice(0, 50) : '(post)');
}

function ResolveRow({ report }: { report: AdminReport }) {
  const api = useAdminApi();
  const qc = useQueryClient();
  const [action, setAction] = useState<NonNullable<ResolveReportPayload['action']>>('none');

  const mut = useMutation({
    mutationFn: (status: ResolveReportPayload['status']) => api.resolveReport(report._id, { status, action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const t = STATUS_TINT[report.status] ?? STATUS_TINT.pending;
  const isOpen = report.status === 'pending' || report.status === 'reviewing';

  return (
    <li className="flex flex-col gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Flag size={13} style={{ color: 'var(--color-primary)' }} />
            {report.target_type} · {report.reason}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
            Target: <span style={{ color: 'var(--text-h)' }}>{targetLabel(report)}</span>
          </p>
          {report.details && <p className="text-xs mt-1 italic" style={{ color: 'var(--text)' }}>"{report.details}"</p>}
          <p className="text-[11px] mt-1" style={{ color: 'var(--text)' }}>
            by @{report.reporter_id?.username ?? '?'} · {report.created_at.slice(0, 10)}
          </p>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0" style={{ background: t.bg, color: t.fg }}>
          {report.status}
        </span>
      </div>

      {isOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <select value={action} onChange={e => setAction(e.target.value as typeof action)} className="rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <button onClick={() => mut.mutate('resolved')} disabled={mut.isPending} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" style={{ background: 'var(--color-primary)' }}>
            <Check size={13} /> Resolve
          </button>
          <button onClick={() => mut.mutate('dismissed')} disabled={mut.isPending} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--color-neutral)', color: 'var(--text)' }}>
            <X size={13} /> Dismiss
          </button>
        </div>
      ) : (
        <p className="text-[11px]" style={{ color: 'var(--text)' }}>
          {report.action_taken && report.action_taken !== 'none' ? `Action: ${report.action_taken} · ` : ''}
          {report.resolved_by ? `by @${report.resolved_by.username}` : ''}
        </p>
      )}
    </li>
  );
}

export function AdminReports() {
  const api = useAdminApi();
  const [status, setStatus] = useState('pending');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', { status, type, page }],
    queryFn: () => api.listReports({ status, type, page }),
    staleTime: 10_000,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Reports</h1>
        <button onClick={() => api.exportReportsCsv()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
          <option value="">All types</option>
          <option value="user">Users</option>
          <option value="post">Posts</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text)' }}>No reports</p>
        ) : (
          <ul>{data.items.map(r => <ResolveRow key={r._id} report={r} />)}</ul>
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
