import { useApi } from '../../../lib/api.ts';

export interface ShoutAuthor {
  _id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface ShoutMessage {
  _id: string;
  author_id: ShoutAuthor;
  body: string;
  pinned: boolean;
  created_at: string;
}

export function useShoutboxApi() {
  const api = useApi();

  return {
    /** Shared friend feed: own + friends' shouts */
    getFeed: () => api.get<ShoutMessage[]>('/shoutbox'),
    postShout: (body: string) => api.post<ShoutMessage>('/shoutbox', { body }),
    deleteShout: (id: string) =>
      api.delete<{ deleted: boolean }>(`/shoutbox/message/${id}`),
  };
}
