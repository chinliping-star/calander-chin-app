import { useApi } from '../../../lib/api.ts';

export interface ProfileFriend {
  _id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface ProfileMeetup {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  with: {
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
}

export interface ProfileCommunity {
  _id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  category?: string;
  member_count: number;
}

export interface ProfileBooking {
  _id: string;
  title?: string;
  content: string;
  event_date?: string;
  event_location: string;
  community: { name: string; slug: string } | null;
}

export interface ProfileData {
  interests: string[];
  counts: { friends: number; meetups: number; communities: number };
  friends: ProfileFriend[];
  meetups: ProfileMeetup[];
  communities: ProfileCommunity[];
  bookings: ProfileBooking[];
}

export function useProfileApi() {
  const api = useApi();

  return {
    getProfileData: (username: string) =>
      api.get<ProfileData>(`/users/${username}/profile-data`),
  };
}
