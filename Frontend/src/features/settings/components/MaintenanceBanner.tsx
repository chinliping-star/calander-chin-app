import { useQuery } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import { useApi } from '../../../lib/api.ts';
import { useIsAdmin } from '../../admin/hooks/useIsAdmin.ts';

interface PublicSettings {
  app_name: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export function MaintenanceBanner() {
  const api = useApi();
  const { isAdmin } = useIsAdmin();
  const { data } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => api.get<PublicSettings>('/settings/public'),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  // Admins keep working during maintenance; everyone else sees the notice.
  if (!data?.maintenance_mode || isAdmin) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-6 pt-4">
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)' }}>
        <Wrench size={18} style={{ color: '#b45309' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
          {data.maintenance_message || 'We are doing some maintenance. Some features may be unavailable.'}
        </p>
      </div>
    </div>
  );
}
