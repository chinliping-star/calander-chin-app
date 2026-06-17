import { useApi } from '../../../lib/api';
import type { Conversation, Message } from '../types';

export function useChatApi() {
  const api = useApi();

  return {
    getConversations: () => api.get<Conversation[]>('/chat/conversations'),

    createPrivateChat: (recipientId: string) =>
      api.post<Conversation>('/chat/conversations', { recipientId }),

    createGroupChat: (name: string, participantIds: string[], avatar_url?: string) =>
      api.post<Conversation>('/chat/conversations/group', { name, participantIds, avatar_url }),

    getMessages: (convId: string, before?: string) => {
      const qs = before ? `?before=${before}` : '';
      return api.get<Message[]>(`/chat/conversations/${convId}/messages${qs}`);
    },

    addMember: (convId: string, userId: string) =>
      api.post<Conversation>(`/chat/conversations/${convId}/members`, { userId }),

    removeMember: (convId: string, userId: string) =>
      api.delete<Conversation>(`/chat/conversations/${convId}/members/${userId}`),

    getUnreadCount: () => api.get<{ count: number }>('/chat/unread'),
  };
}
