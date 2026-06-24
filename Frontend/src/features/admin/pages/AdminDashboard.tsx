import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Crown, Ban, PauseCircle, FileText, CalendarDays, Boxes, UserPlus } from 'lucide-react';
import { useAdminApi, type AdminStats } from '../api/admin.api.ts';

function Kpi({ label, value, icon: Icon, tint }: {
  label: string; value: number; icon: typeof Users; tint?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: tint ?? 'var(--accent-bg)' }}>
        <Icon size={20} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: 'var(--text-h)' }}>{value.toLocaleString()}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>{label}</p>
      </div>
    </div>
  );
}

function MiniBars({ title, data }: { title: string; data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-h)' }}>{title}</p>
      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
        {data.map(d => (
          <div key={d.date} className="flex-1 flex items-end h-full" title={`${d.date}: ${d.count}`}>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count ? 8 : 3)}%`,
                background: 'var(--color-primary)',
                opacity: d.count ? 1 : 0.25,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--text)' }}>
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const api = useAdminApi();
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.stats(),
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>;
  }

  const k = data.kpis;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total Users"      value={k.totalUsers}      icon={Users} />
        <Kpi label="Premium"          value={k.premiumUsers}    icon={Crown} />
        <Kpi label="Suspended"        value={k.suspendedUsers}  icon={PauseCircle} />
        <Kpi label="Blocked"          value={k.blockedUsers}    icon={Ban} />
        <Kpi label="New Today"        value={k.newToday}        icon={UserPlus} />
        <Kpi label="New This Week"    value={k.newThisWeek}     icon={UserPlus} />
        <Kpi label="New This Month"   value={k.newThisMonth}    icon={UserPlus} />
        <Kpi label="Total Posts"      value={k.totalPosts}      icon={FileText} />
        <Kpi label="Total Meetups"    value={k.totalMeetups}    icon={CalendarDays} />
        <Kpi label="Communities"      value={k.totalCommunities} icon={Boxes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniBars title="User Growth (14 days)" data={data.charts.userGrowth} />
        <MiniBars title="Posts Created (14 days)" data={data.charts.postVolume} />
      </div>
    </div>
  );
}
