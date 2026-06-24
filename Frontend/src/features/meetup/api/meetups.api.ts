import { useApi } from '../../../lib/api.ts';
import type { ApiMeetup } from '../../calendar/api/calendar.api.ts';

export interface CreateMeetupPayload {
  owner_id: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  is_private?: boolean;
  participants?: string[];
}

export interface UpdateMeetupPayload {
  date?: string;
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  participants?: string[];
}

export function useMeetupsApi() {
  const api = useApi();

  return {
    getMeetups:   ()                              => api.get<ApiMeetup[]>('/meetups'),
    getMeetup:    (id: string)                    => api.get<ApiMeetup>(`/meetups/${id}`),
    createMeetup: (payload: CreateMeetupPayload)  => api.post<ApiMeetup>('/meetups', payload),
    updateMeetup: (id: string, payload: UpdateMeetupPayload) => api.patch<ApiMeetup>(`/meetups/${id}`, payload),
    acceptMeetup: (id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/accept`),
    declineMeetup:(id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/decline`),
    cancelMeetup: (id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/cancel`),
    deleteMeetup: (id: string)                    => api.delete<void>(`/meetups/${id}`),
  };
}
