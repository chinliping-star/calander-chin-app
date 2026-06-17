import { api } from '../../../lib/api.ts';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types.ts';
import type { User } from '../../../types/index.ts';

function normalizeUser(raw: AuthResponse['user']): User {
  return {
    _id: raw._id,
    username: raw.username,
    display_name: raw.display_name,
    avatar_url: raw.avatar_url ?? '',
    banner_url: raw.banner_url,
    theme: raw.theme,
    is_premium: raw.is_premium,
  };
}

export async function login(payload: LoginPayload): Promise<{ user: User; accessToken: string }> {
  const res = await api.post<AuthResponse>('/auth/login', payload);
  return { user: normalizeUser(res.user), accessToken: res.accessToken };
}

export async function register(payload: RegisterPayload): Promise<{ user: User; accessToken: string }> {
  const res = await api.post<AuthResponse>('/auth/register', payload);
  return { user: normalizeUser(res.user), accessToken: res.accessToken };
}

export async function logout(): Promise<void> {
  await api.delete<void>('/auth/logout');
}
