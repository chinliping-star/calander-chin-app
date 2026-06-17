export interface User {
  _id?: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  theme?: string;
  is_premium?: boolean;
  clerk_id?: string;
}

export type DayStatus = 'available' | 'blocked' | 'accepted' | 'pending';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  eventLabel?: string;
  stickers?: string[];
}

export type MeetupStatus = 'pending' | 'accepted' | 'declined';

export interface Meetup {
  id: string;
  proposerId: string;
  ownerId: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  description?: string;
  participants: string[];
  status: MeetupStatus;
  isPrivate: boolean;
  memoryPhotoUrl?: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface MeetupRequest {
  id: string;
  proposer: Friend;
  title: string;
  date: string;
  status: MeetupStatus;
}
