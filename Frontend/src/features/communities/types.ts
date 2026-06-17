export interface CommunityUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export interface Community {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  category?: string;
  is_private: boolean;
  owner_id: CommunityUser | string;
  member_count: number;
  created_at: string;
  userRole?: string | null;
}

export interface CommunityMember {
  _id: string;
  community_id: string;
  user_id: CommunityUser;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
}

export interface CommunityPost {
  _id: string;
  community_id: string;
  author_id: CommunityUser;
  type: 'post' | 'announcement' | 'event';
  title?: string;
  content: string;
  image_url?: string;
  event_date?: string;
  event_location?: string;
  created_at: string;
}
