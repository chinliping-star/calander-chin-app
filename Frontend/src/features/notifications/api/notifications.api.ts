import { useApi } from '../../../lib/api';
import type { Notification } from '../types';

export function useNotificationsApi() {
  const api = useApi();
  return {
    getAll:        ()           => api.get<Notification[]>('/notifications'),
    getUnread:     ()           => api.get<{ count: number }>('/notifications/unread-count'),
    markRead:      (id: string) => api.patch<void>(`/notifications/${id}/read`, {}),
    markAllRead:   ()           => api.patch<void>('/notifications/read-all', {}),
  };
}
