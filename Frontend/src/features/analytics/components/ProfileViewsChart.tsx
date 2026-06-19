import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAnalyticsApi } from '../api/analytics.api';
import { CustomSelect } from '../../../components/ui/CustomSelect.tsx';
import type { SelectOption } from '../../../components/ui/CustomSelect.tsx';
import type { Period } from '../types';
import { useState } from 'react';
import { effectivePremium } from '../../../lib/featureFlags.ts';

const PERIOD_OPTIONS: SelectOption<Period>[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 100 }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{label}</p>
      <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{payload[0].value} views</p>
    </div>
  );
}

export function ProfileViewsChart({ isPremium }: { isPremium: boolean }) {
  const api = useAnalyticsApi();
  const [period, setPeriod] = useState<Period>('weekly');
  const premium = effectivePremium(isPremium);

  const { data = [] } = useQuery({
    queryKey: ['analytics-profile-views', period],
    queryFn: () => api.getProfileViews(period),
    staleTime: 60_000,
  });

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', boxShadow: '0 2px 12px rgba(74,62,78,0.06)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Profile Views</h3>
          <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-primary)' }}>
            {total.toLocaleString()}
            <span className="text-xs font-normal ml-1" style={{ color: 'var(--text)' }}>total</span>
          </p>
        </div>
        <div className="w-32 shrink-0">
          <CustomSelect<Period>
            value={period}
            onChange={v => { if (v !== 'daily' || premium) setPeriod(v); }}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>

      {!premium && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}>
          Free plan shows last 7 days. Upgrade for all-time data.
        </p>
      )}

      {data.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl" style={{ height: 240, background: 'var(--color-neutral)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>No profile views yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#viewsGrad)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--bg)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
