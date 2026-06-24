import { useApi } from '../../../lib/api.ts';

export interface CreateReportPayload {
  target_type: 'user' | 'post';
  target_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other';
  details?: string;
}

export function useReportsApi() {
  const api = useApi();
  return {
    create: (payload: CreateReportPayload) => api.post<{ _id: string }>('/reports', payload),
  };
}
