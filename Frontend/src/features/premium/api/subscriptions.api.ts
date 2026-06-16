import { useApi } from '../../../lib/api';

export interface Subscription {
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  current_period_end: string;
}

export function useSubscriptionsApi() {
  const api = useApi();
  return {
    getMe:           ()                          => api.get<Subscription | null>('/subscriptions/me'),
    createCheckout:  (plan: 'monthly' | 'yearly') => api.post<{ url: string }>('/subscriptions/checkout', { plan }),
    cancel:          ()                          => api.delete<void>('/subscriptions/me'),
  };
}
