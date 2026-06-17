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

export function useMeetupsApi() {
  const api = useApi();

  return {
    getMeetups:   ()                              => api.get<ApiMeetup[]>('/meetups'),
    getMeetup:    (id: string)                    => api.get<ApiMeetup>(`/meetups/${id}`),
    createMeetup: (payload: CreateMeetupPayload)  => api.post<ApiMeetup>('/meetups', payload),
    acceptMeetup: (id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/accept`),
    declineMeetup:(id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/decline`),
    cancelMeetup: (id: string)                    => api.patch<ApiMeetup>(`/meetups/${id}/cancel`),
  };
}
