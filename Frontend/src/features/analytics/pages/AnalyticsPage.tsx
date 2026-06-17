import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, Star } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { useAnalyticsApi } from '../api/analytics.api';
import { StatsCard } from '../components/StatsCard.tsx';
import { AttendanceDonut } from '../components/AttendanceDonut.tsx';
import { ActivityBarChart } from '../components/ActivityBarChart.tsx';

export default function AnalyticsPage() {
  const api = useAnalyticsApi();
const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.getOverview(),
    staleTime: 60_000,
  });

  const { data: attendance } = useQuery({
    queryKey: ['analytics-attendance'],
    queryFn: () => api.getMyAttendanceStats(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-neutral)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <AppShell>
    <div className="pb-16">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>Your profile activity at a glance</p>
      </div>

      <div className="px-4 max-w-6xl mx-auto flex flex-col gap-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatsCard
            label="Friends"
            value={overview?.friends ?? 0}
            icon={<Users size={16} />}
          />
          <StatsCard
            label="Meetups"
            value={overview?.meetups ?? 0}
            icon={<CalendarCheck size={16} />}
          />
          <StatsCard
            label="Reliability"
            value={`${overview?.attendanceScore ?? 0}%`}
            sub="attendance score"
            icon={<Star size={16} />}
          />
        </div>

        {/* Attendance + activity row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {attendance && (
            <AttendanceDonut
              attended={attendance.attended}
              missed={attendance.missed}
              skipped={attendance.skipped}
              score={attendance.score}
            />
          )}
          <ActivityBarChart type="meetups" title="Meetup Requests" />
        </div>

        <ActivityBarChart type="friends" title="Friend Requests" />
      </div>
    </div>
    </AppShell>
  );
}
