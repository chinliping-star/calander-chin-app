export interface ProposeMeetupPayload {
  ownerId: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  isPrivate: boolean;
}

export type MoodTheme = 'chill' | 'productive' | 'celebration' | 'dining';

export interface MoodOption {
  key: MoodTheme;
  label: string;
  emoji: string;
}

export interface InvitableFriend {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
}

export interface ProposedSlotData {
  id: string;
  date: string;
  time: string;
  location: string;
}

export interface NewMeetupFormValues {
  title: string;
  date: string;
  time: string;
  location: string;
  details: string;
  invitedFriendIds: string[];
}
