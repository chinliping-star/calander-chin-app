/**
 * Axios instance placeholder.
 * Install axios, then replace this with:
 *
 *   import axios from 'axios';
 *   export const api = axios.create({
 *     baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
 *     withCredentials: true,
 *   });
 *
 * Add a response interceptor here to handle JWT refresh on 401.
 */

const BASE_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL'] ??
  'http://localhost:3000/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API ${method} ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
