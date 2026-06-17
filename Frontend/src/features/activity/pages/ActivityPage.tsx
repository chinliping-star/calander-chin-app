import { useQuery } from '@tanstack/react-query';
import { useActivityApi } from '../api/activity.api.ts';
import { ActivityItem } from '../components/ActivityItem.tsx';
import { AppShell } from '../../../components/layout/AppShell.tsx';

export default function ActivityPage() {
  const api = useActivityApi();

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => api.getFeed(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <AppShell>
    <div className="pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-h)' }}>Activity</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text)' }}>What your friends are up to</p>

        <div
          className="rounded-2xl divide-y"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', divideColor: 'var(--border)' }}
        >
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : feed.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">🌸</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>No activity yet. Add some friends!</p>
            </div>
          ) : (
            feed.map(a => (
              <div key={a._id} className="px-4" style={{ borderColor: 'var(--border)' }}>
                <ActivityItem activity={a} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
