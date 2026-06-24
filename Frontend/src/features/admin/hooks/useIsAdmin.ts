import { useQuery } from '@tanstack/react-query';
import { useAdminApi } from '../api/admin.api.ts';

/** Probes /admin/check. Non-admins get 403 → isAdmin false. */
export function useIsAdmin() {
  const api = useAdminApi();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'check'],
    queryFn: () => api.check().then(r => r.isAdmin).catch(() => false),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { isAdmin: !!data, isLoading };
}
