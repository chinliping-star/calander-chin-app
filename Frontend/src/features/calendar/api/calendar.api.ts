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
  theme?: string;
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
  responses?: ApiMeetupResponse[];
  memory_photo_url?: string;
  memory_photos?: ApiMemoryPhoto[];
  // Proposal / voting (poll-style meetups)
  is_proposal?: boolean;
  proposed_slots?: ApiProposedSlot[];
  slot_votes?: ApiSlotVote[];
  locked_slot_id?: string | null;
  created_at: string;
}

export interface ApiProposedSlot {
  _id: string;
  date: string;
  time: string;
  location: string;
}

export interface ApiSlotVote {
  slot_id: string;
  user_id: string;
}

export interface ApiMeetupResponse {
  user_id: ApiMeetupUser;
  status: 'pending' | 'accepted' | 'declined';
}

export interface ApiMemoryPhoto {
  _id: string;
  url: string;
  added_by: ApiMeetupUser;
  added_at: string;
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
