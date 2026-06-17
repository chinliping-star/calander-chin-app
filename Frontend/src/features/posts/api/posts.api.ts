import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../../../lib/api';
import type { Post } from '../types';

const BASE_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL'] ?? 'http://localhost:3000/api';

export function usePostsApi() {
  const { getToken } = useAuth();
  const api = useApi();

  return {
    getByUsername: (username: string) =>
      api.get<Post[]>(`/posts/${username}`),

    getFeed: (page = 1) =>
      api.get<Post[]>(`/posts/feed?page=${page}`),

    create: async (data: {
      content: string;
      title?: string;
      privacy?: string;
      type?: string;
      image?: File | null;
    }): Promise<Post> => {
      const token = await getToken();
      const formData = new FormData();
      formData.append('content', data.content);
      if (data.title)   formData.append('title', data.title);
      if (data.privacy) formData.append('privacy', data.privacy);
      if (data.type)    formData.append('type', data.type);
      if (data.image)   formData.append('image', data.image);

      const res = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `${res.status}` })) as { message?: string };
        throw new Error(err.message ?? 'Failed to create post');
      }
      return res.json() as Promise<Post>;
    },

    update: (id: string, data: { content?: string; title?: string; privacy?: string }) =>
      api.patch<Post>(`/posts/${id}`, data),

    delete: (id: string) => api.delete<void>(`/posts/${id}`),
  };
}
