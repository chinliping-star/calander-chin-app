export type FriendTag = 'CLOSE FRIEND' | 'BOOK CLUB' | 'GYM BUDDY' | 'COWORKER' | 'FAMILY' | 'BEST FRIEND' | 'WORK COLLEAGUE';

export interface FriendProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  nextMeetup?: string;
  meetupCount: number;
  tags: FriendTag[];
  mutualCount?: number;
  theme?: string;
}

export interface PendingRequest {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  mutualCount?: number;
  mutualTag?: string;
}

export interface SuggestedPerson {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  mutualContext: string;
}

export type SidebarSection = 'all' | 'invites' | 'proposals' | 'past' | 'archived';
