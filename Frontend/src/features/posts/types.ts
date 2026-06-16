export interface PostAuthor {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export type PostPrivacy = 'public' | 'friends' | 'private';
export type PostType = 'text' | 'image' | 'event_memory' | 'meetup_story';

export interface Post {
  _id: string;
  author_id: PostAuthor;
  type: PostType;
  title?: string;
  content: string;
  image_url?: string;
  privacy: PostPrivacy;
  meetup_ref?: string;
  created_at: string;
  updated_at: string;
}
