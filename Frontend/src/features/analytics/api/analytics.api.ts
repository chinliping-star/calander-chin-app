import { useApi } from '../../../lib/api';
import type { AnalyticsOverview, ChartPoint, FriendRequestStats, Period } from '../types';

export function useAnalyticsApi() {
  const api = useApi();
  return {
    getOverview:          ()               => api.get<AnalyticsOverview>('/analytics/overview'),
    getProfileViews:      (p: Period)      => api.get<ChartPoint[]>(`/analytics/profile-views?period=${p}`),
    getWhoViewed:         ()               => api.get<unknown[]>('/analytics/who-viewed'),
    getFriendRequests:    (p: Period)      => api.get<FriendRequestStats>(`/analytics/friend-requests?period=${p}`),
    getMeetupRequests:    (p: Period)      => api.get<FriendRequestStats>(`/analytics/meetup-requests?period=${p}`),
    getMyAttendanceStats: ()               => api.get<{ attended: number; missed: number; skipped: number; score: number }>('/attendance/me/stats'),
    markAttendance:       (meetupId: string, status: string) =>
      api.post<unknown>('/attendance', { meetupId, status }),
  };
}
