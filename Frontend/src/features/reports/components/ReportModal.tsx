import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { Flag, X, Check, Loader2 } from 'lucide-react';
import { useReportsApi, type CreateReportPayload } from '../api/reports.api.ts';

const REASONS: { value: CreateReportPayload['reason']; label: string }[] = [
  { value: 'spam',          label: 'Spam' },
  { value: 'harassment',    label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate / offensive' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other',         label: 'Something else' },
];

export function ReportModal({ targetType, targetId, onClose }: {
  targetType: 'user' | 'post';
  targetId: string;
  onClose: () => void;
}) {
  const api = useReportsApi();
  const [reason, setReason] = useState<CreateReportPayload['reason']>('spam');
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () => api.create({ target_type: targetType, target_id: targetId, reason, details: details || undefined }),
    onSuccess: () => { setDone(true); setTimeout(onClose, 1200); },
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(15,10,20,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-h)' }}>
            <Flag size={16} style={{ color: 'var(--color-primary)' }} />
            Report {targetType}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text)' }}><X size={18} /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Check size={28} style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>Report submitted</p>
            <p className="text-xs" style={{ color: 'var(--text)' }}>Our team will review it. Thanks!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer" style={{ background: reason === r.value ? 'var(--accent-bg)' : 'transparent', color: 'var(--text-h)' }}>
                  <input type="radio" name="reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              placeholder="Add details (optional)"
              className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            />
            {submit.isError && <p className="text-xs" style={{ color: '#dc2626' }}>{(submit.error as Error).message}</p>}
            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}
            >
              {submit.isPending ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
              Submit report
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
