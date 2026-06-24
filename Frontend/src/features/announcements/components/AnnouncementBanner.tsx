import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, X, AlertTriangle, Pin } from 'lucide-react';
import { useAnnouncementsApi, type Announcement } from '../api/announcements.api.ts';

const PRIORITY_TINT: Record<string, { bg: string; border: string; fg: string }> = {
  high:   { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)', fg: '#dc2626' },
  normal: { bg: 'var(--accent-bg)',      border: 'var(--accent-border)', fg: 'var(--color-primary-dark)' },
  low:    { bg: 'var(--color-neutral)',  border: 'var(--border)',        fg: 'var(--text-h)' },
};

function Banner({ a }: { a: Announcement }) {
  const api = useAnnouncementsApi();
  const qc = useQueryClient();
  const dismiss = useMutation({
    mutationFn: () => api.dismiss(a._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements', 'active'] }),
  });

  const t = PRIORITY_TINT[a.priority] ?? PRIORITY_TINT.normal;
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
      <div className="mt-0.5 shrink-0" style={{ color: t.fg }}>
        {a.priority === 'high' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
          {a.is_pinned && <Pin size={12} style={{ color: t.fg }} />}
          {a.title}
        </p>
        <p className="text-xs mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{a.body}</p>
      </div>
      <button onClick={() => dismiss.mutate()} aria-label="Dismiss" className="shrink-0 p-1 rounded-lg hover:opacity-70" style={{ color: 'var(--text)' }}>
        <X size={16} />
      </button>
    </div>
  );
}

export function AnnouncementBanner() {
  const api = useAnnouncementsApi();
  const { data = [] } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: () => api.active(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  if (data.length === 0) return null;
  return (
    <div className="mx-auto max-w-screen-xl flex flex-col gap-2 px-6 pt-4">
      {data.map(a => <Banner key={a._id} a={a} />)}
    </div>
  );
}
