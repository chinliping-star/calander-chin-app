import { useApi } from '../../../lib/api';
import type { Activity, RsvpEvent, RsvpStatus } from '../types';

export function useActivityApi() {
  const api = useApi();
  return {
    getFeed:         ()                           => api.get<Activity[]>('/activity/feed'),
    getUserActivity: (username: string)           => api.get<Activity[]>(`/activity/users/${username}`),
    getRsvp:         (eventId: string)            => api.get<RsvpEvent>(`/rsvp/${eventId}`),
    getMyRsvp:       (eventId: string)            => api.get<{ status: RsvpStatus } | null>(`/rsvp/${eventId}/me`),
    upsertRsvp:      (eventId: string, status: RsvpStatus) =>
      api.post<void>(`/rsvp/${eventId}`, { status }),
    removeRsvp:      (eventId: string)            => api.delete<void>(`/rsvp/${eventId}`),
  };
}
