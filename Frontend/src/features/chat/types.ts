export interface ChatUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface LastMessage {
  content: string;
  sender_id: ChatUser | string;
  sent_at: string;
}

export interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants: ChatUser[];
  name?: string;
  avatar_url?: string;
  owner_id?: ChatUser | string;
  last_message?: LastMessage | null;
  created_at: string;
}

export interface Message {
  _id: string;
  conversation_id: string;
  sender_id: ChatUser;
  content: string;
  seen_by: string[];
  edited: boolean;
  created_at: string;
}
