import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { useAnalyticsApi } from '../api/analytics.api';

interface Props {
  meetupId: string;
  meetupTitle: string;
  meetupDate: string;
  currentStatus?: 'attended' | 'missed' | 'skipped' | null;
}

const OPTIONS = [
  { value: 'attended', label: 'Attended', icon: CheckCircle2, color: '#22c55e' },
  { value: 'missed',   label: 'Missed',   icon: XCircle,      color: '#ef4444' },
  { value: 'skipped',  label: 'Skipped',  icon: MinusCircle,  color: '#f59e0b' },
] as const;

export function AttendanceMarker({ meetupId, meetupTitle, meetupDate, currentStatus }: Props) {
  const api = useAnalyticsApi();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(currentStatus ?? null);

  const { mutate, isPending } = useMutation({
    mutationFn: (status: string) => api.markAttendance(meetupId, status),
    onSuccess: (_, status) => {
      setSelected(status);
      qc.invalidateQueries({ queryKey: ['analytics-attendance'] });
      qc.invalidateQueries({ queryKey: ['my-attendance'] });
      qc.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>{meetupTitle}</p>
        <p className="text-xs" style={{ color: 'var(--text)' }}>{meetupDate}</p>
      </div>

      <div className="flex gap-2">
        {OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => mutate(opt.value)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? opt.color : 'var(--color-neutral)',
                color:      active ? '#fff' : 'var(--text)',
                border:     `1px solid ${active ? opt.color : 'var(--border)'}`,
                opacity:    isPending ? 0.6 : 1,
              }}
            >
              <Icon size={13} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
