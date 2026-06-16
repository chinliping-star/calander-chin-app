import { useAuth } from '@clerk/clerk-react';

const BASE_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL'] ??
  'http://localhost:3000/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `${res.status}` })) as { message?: string };
    throw new Error(err.message ?? `API ${method} ${path} failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useApi() {
  const { getToken } = useAuth();

  async function authRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await getToken();
    return request<T>(method, path, body, token);
  }

  return {
    get:    <T>(path: string)                 => authRequest<T>('GET',    path),
    post:   <T>(path: string, body?: unknown) => authRequest<T>('POST',   path, body),
    patch:  <T>(path: string, body?: unknown) => authRequest<T>('PATCH',  path, body),
    delete: <T>(path: string)                 => authRequest<T>('DELETE', path),
  };
}

// For non-hook contexts (server-side calls, public endpoints)
export const api = {
  get:    <T>(path: string)                 => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
};
