import { useAuth } from '@clerk/clerk-react';
import type { ApiMeetup } from '../../calendar/api/calendar.api.ts';

const BASE_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL'] ??
  'http://localhost:3000/api';

export function useMemoryApi() {
  const { getToken } = useAuth();

  async function authFetch<T>(method: string, path: string, body?: FormData | string): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (typeof body === 'string') headers['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `${res.status}` })) as { message?: string };
      throw new Error(err.message ?? `${method} ${path} failed: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    getAlbum: () =>
      authFetch<ApiMeetup[]>('GET', '/memory'),

    uploadPhoto: (meetupId: string, file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return authFetch<ApiMeetup>('POST', `/memory/${meetupId}/photo`, form);
    },

    deletePhoto: (meetupId: string, photoId: string) =>
      authFetch<ApiMeetup>('DELETE', `/memory/${meetupId}/photo/${photoId}`),
  };
}
