import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useAnalyticsApi } from '../api/analytics.api';
import { CustomSelect } from '../../../components/ui/CustomSelect.tsx';
import type { SelectOption } from '../../../components/ui/CustomSelect.tsx';
import type { Period } from '../types';

const PERIOD_OPTIONS: SelectOption<Period>[] = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 110 }}>
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
            <span style={{ color: 'var(--text)' }}>{p.name}</span>
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-h)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  type: 'friends' | 'meetups';
  title: string;
}

export function ActivityBarChart({ type, title }: Props) {
  const api = useAnalyticsApi();
  const [period, setPeriod] = useState<Period>('weekly');

  const queryFn = type === 'friends'
    ? () => api.getFriendRequests(period)
    : () => api.getMeetupRequests(period);

  const { data } = useQuery({
    queryKey: [`analytics-${type}`, period],
    queryFn,
    staleTime: 60_000,
  });

  const merged = (data?.sent ?? []).map((s, i) => ({
    label: s.label,
    Sent:     s.count,
    Received: data?.received[i]?.count ?? 0,
  }));

  const sentColor     = 'var(--color-primary)';
  const receivedColor = 'var(--color-primary-light)';

  const totalSent     = merged.reduce((s, d) => s + d.Sent, 0);
  const totalReceived = merged.reduce((s, d) => s + d.Received, 0);

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', boxShadow: '0 2px 12px rgba(74,62,78,0.06)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>{title}</h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: sentColor }} />
              Sent <strong style={{ color: 'var(--text-h)' }}>{totalSent}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: receivedColor }} />
              Received <strong style={{ color: 'var(--text-h)' }}>{totalReceived}</strong>
            </span>
          </div>
        </div>
        <div className="w-32 shrink-0">
          <CustomSelect<Period>
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>

      {merged.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl" style={{ height: 240, background: 'var(--color-neutral)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>No activity data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={merged} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text)' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-neutral)', radius: 4 }} />
            <Bar dataKey="Sent"     fill={sentColor}     radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Received" fill={receivedColor} radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
