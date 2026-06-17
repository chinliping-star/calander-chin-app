export interface ActivityActor {
  username: string;
  display_name: string;
  avatar_url?: string;
}

export type ActivityType =
  | 'meetup_accepted'
  | 'friend_added'
  | 'community_joined'
  | 'community_created'
  | 'post_created';

export interface Activity {
  _id: string;
  actor: ActivityActor;
  type: ActivityType;
  ref_id: string;
  ref_model: string;
  meta?: Record<string, string>;
  created_at: string;
}

export type RsvpStatus = 'going' | 'interested' | 'not_going';

export interface RsvpCounts {
  going: number;
  interested: number;
  not_going: number;
}

export interface RsvpEvent {
  going: ActivityActor[];
  interested: ActivityActor[];
  not_going: ActivityActor[];
  counts: RsvpCounts;
}
