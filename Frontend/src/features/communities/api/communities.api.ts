import { useApi } from '../../../lib/api';
import { api as publicApi } from '../../../lib/api';
import type { Community, CommunityMember, CommunityPost } from '../types';

export function useCommunitiesApi() {
  const api = useApi();

  return {
    browse:       (page = 1)              => publicApi.get<Community[]>(`/communities?page=${page}`),
    search:       (q: string)             => publicApi.get<Community[]>(`/communities/search?q=${encodeURIComponent(q)}`),
    getBySlug:    (slug: string)          => publicApi.get<Community>(`/communities/${slug}`),
    getMine:      ()                      => api.get<Community[]>('/communities/mine'),

    create: (dto: {
      name: string; slug: string; description?: string;
      category?: string; is_private?: boolean;
      avatar_url?: string; banner_url?: string;
    }) => api.post<Community>('/communities', dto),

    update: (id: string, dto: Partial<{ name: string; description: string; category: string; is_private: boolean; avatar_url: string; banner_url: string }>) =>
      api.patch<Community>(`/communities/${id}`, dto),

    delete: (id: string) => api.delete<void>(`/communities/${id}`),

    join:         (id: string)            => api.post<void>(`/communities/${id}/join`),
    leave:        (id: string)            => api.delete<void>(`/communities/${id}/leave`),
    getMembers:   (id: string)            => publicApi.get<CommunityMember[]>(`/communities/${id}/members`),
    updateRole:   (id: string, userId: string, role: 'moderator' | 'member') =>
      api.patch<void>(`/communities/${id}/members/${userId}/role`, { role }),
    removeMember: (id: string, userId: string) =>
      api.delete<void>(`/communities/${id}/members/${userId}`),

    getPosts:   (id: string, page = 1)    => publicApi.get<CommunityPost[]>(`/communities/${id}/posts?page=${page}`),
    createPost: (id: string, dto: { content: string; title?: string; type?: string; image_url?: string; event_date?: string; event_location?: string }) =>
      api.post<CommunityPost>(`/communities/${id}/posts`, dto),
    deletePost: (id: string, postId: string) => api.delete<void>(`/communities/${id}/posts/${postId}`),
  };
}
