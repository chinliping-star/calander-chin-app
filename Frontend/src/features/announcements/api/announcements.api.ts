import { useApi } from '../../../lib/api.ts';

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  audience: 'all' | 'premium' | 'admins';
  is_pinned: boolean;
  publish_at: string;
  expires_at?: string | null;
  views: number;
  created_at: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
  audience?: 'all' | 'premium' | 'admins';
  is_pinned?: boolean;
  publish_at?: string;
  expires_at?: string | null;
}

export function useAnnouncementsApi() {
  const api = useApi();
  return {
    // user
    active:  () => api.get<Announcement[]>('/announcements/active'),
    dismiss: (id: string) => api.post<{ ok: boolean }>(`/announcements/${id}/dismiss`),
    // admin
    list:    () => api.get<Announcement[]>('/announcements'),
    create:  (body: AnnouncementPayload) => api.post<Announcement>('/announcements', body),
    update:  (id: string, body: Partial<AnnouncementPayload>) => api.patch<Announcement>(`/announcements/${id}`, body),
    remove:  (id: string) => api.delete<{ ok: boolean }>(`/announcements/${id}`),
  };
}
