export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'meetup_proposed'
  | 'meetup_accepted'
  | 'meetup_declined'
  | 'community_invite'
  | 'community_post'
  | 'message_received';

export interface NotificationActor {
  _id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_id?: NotificationActor;
  ref_id?: string;
  is_read: boolean;
  created_at: string;
}
