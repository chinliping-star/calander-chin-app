import { useApi } from '../../../lib/api.ts';
import type { DayStatus } from '../../../types/index.ts';

export interface ApiCalendarDay {
  _id: string;
  user_id: string;
  date: string;
  status: DayStatus;
  stickers?: string[];
}

export interface ApiMeetupUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export interface ApiMeetup {
  _id: string;
  proposer_id: ApiMeetupUser;
  owner_id: ApiMeetupUser;
  date: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  is_private: boolean;
  participants: ApiMeetupUser[];
  memory_photo_url?: string;
  created_at: string;
}

export interface ApiCalendarUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  theme?: string;
}

export interface ApiMonthCalendar {
  user: ApiCalendarUser;
  days: ApiCalendarDay[];
  meetups: ApiMeetup[];
}

export function useCalendarApi() {
  const apiHook = useApi();

  return {
    getMonth: (username: string, month: string) =>
      apiHook.get<ApiMonthCalendar>(`/calendar/${username}?month=${month}`),
    markDay: (date: string, status: DayStatus) =>
      apiHook.patch<ApiCalendarDay>('/calendar/day', { date, status }),
    updateStickers: (date: string, stickers: string[]) =>
      apiHook.patch<ApiCalendarDay>('/calendar/day/stickers', { date, stickers }),
  };
}
