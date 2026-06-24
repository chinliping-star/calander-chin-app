import { useApi } from '../../../lib/api.ts';
import { useAuth } from '@clerk/clerk-react';

const BASE_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL'] ??
  'http://localhost:3000/api';

export interface AdminUser {
  _id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'blocked';
  role: 'user' | 'moderator' | 'admin';
  is_premium: boolean;
  is_admin: boolean;
  created_at: string;
  deleted_at?: string | null;
  suspended_until?: string | null;
  moderation_reason?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminStats {
  kpis: {
    totalUsers: number;
    premiumUsers: number;
    suspendedUsers: number;
    blockedUsers: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    totalPosts: number;
    totalMeetups: number;
    totalCommunities: number;
    reportedPosts: number;
    reportedUsers: number;
  };
  charts: {
    userGrowth: { date: string; count: number }[];
    postVolume: { date: string; count: number }[];
  };
}

export interface AdminUserDetail {
  user: AdminUser & Record<string, unknown>;
  activity: { posts: number; meetups: number; communitiesOwned: number };
}

export interface ModerateUserPayload {
  status?: 'active' | 'suspended' | 'blocked';
  suspended_until?: string | null;
  moderation_reason?: string;
  role?: 'user' | 'moderator' | 'admin';
  is_premium?: boolean;
  is_admin?: boolean;
}

export interface AdminPost {
  _id: string;
  title?: string;
  content: string;
  type: string;
  privacy: string;
  image_url?: string;
  author_id?: { _id: string; username: string; display_name: string; avatar_url?: string };
  created_at: string;
}

export interface AdminCommunity {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  member_count: number;
  owner_id?: { _id: string; username: string; display_name: string; avatar_url?: string };
  created_at: string;
}

export interface AdminMeetup {
  _id: string;
  title: string;
  date: string;
  status: string;
  proposer_id?: { _id: string; username: string; display_name: string };
  owner_id?: { _id: string; username: string; display_name: string };
  created_at: string;
}

export interface AdminReport {
  _id: string;
  target_type: 'user' | 'post';
  target_model: 'User' | 'Post';
  reason: string;
  details: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  action_taken: string;
  created_at: string;
  reporter_id?: { _id: string; username: string; display_name: string; avatar_url?: string };
  target_id?: Record<string, unknown>;
  resolved_by?: { username: string; display_name: string };
}

export interface ResolveReportPayload {
  status: 'reviewing' | 'resolved' | 'dismissed';
  action?: 'none' | 'warn' | 'remove_content' | 'suspend_user' | 'block_user';
}

export interface AuditLog {
  _id: string;
  actor_username: string;
  actor_clerk_id: string;
  method: string;
  path: string;
  status: number;
  created_at: string;
}

export interface PlatformSettings {
  _id: string;
  app_name: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  feature_flags: Record<string, boolean>;
  updated_at: string;
}

export interface SettingsPayload {
  app_name?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  feature_flags?: Record<string, boolean>;
}

export interface SupportTicket {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  created_at: string;
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function useAdminApi() {
  const api = useApi();
  const { getToken } = useAuth();

  async function downloadCsv(path: string, filename: string) {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    listReports: (p: { page?: number; status?: string; type?: string }) =>
      api.get<Paginated<AdminReport>>(`/admin/reports${qs(p)}`),
    resolveReport: (id: string, body: ResolveReportPayload) =>
      api.patch<AdminReport>(`/admin/reports/${id}`, body),

    exportUsersCsv:   () => downloadCsv('/admin/export/users.csv', 'users.csv'),
    exportReportsCsv: () => downloadCsv('/admin/export/reports.csv', 'reports.csv'),

    check:  () => api.get<{ isAdmin: boolean }>('/admin/check'),
    stats:  () => api.get<AdminStats>('/admin/stats'),

    listUsers: (p: { page?: number; search?: string; status?: string }) =>
      api.get<Paginated<AdminUser>>(`/admin/users${qs(p)}`),
    getUser:   (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`),
    moderateUser: (id: string, body: ModerateUserPayload) =>
      api.patch<AdminUserDetail>(`/admin/users/${id}`, body),
    deleteUser:  (id: string) => api.delete<{ ok: boolean }>(`/admin/users/${id}`),
    restoreUser: (id: string) => api.post<{ ok: boolean }>(`/admin/users/${id}/restore`),

    listPosts: (p: { page?: number; search?: string }) =>
      api.get<Paginated<AdminPost>>(`/admin/posts${qs(p)}`),
    deletePost: (id: string) => api.delete<{ ok: boolean }>(`/admin/posts/${id}`),

    listCommunities: (p: { page?: number; search?: string }) =>
      api.get<Paginated<AdminCommunity>>(`/admin/communities${qs(p)}`),
    deleteCommunity: (id: string) => api.delete<{ ok: boolean }>(`/admin/communities/${id}`),

    listMeetups: (p: { page?: number; search?: string }) =>
      api.get<Paginated<AdminMeetup>>(`/admin/meetups${qs(p)}`),
    deleteMeetup: (id: string) => api.delete<{ ok: boolean }>(`/admin/meetups/${id}`),

    listAudit: (p: { page?: number }) => api.get<Paginated<AuditLog>>(`/admin/audit${qs(p)}`),

    getSettings:    () => api.get<PlatformSettings>('/admin/settings'),
    updateSettings: (body: SettingsPayload) => api.patch<PlatformSettings>('/admin/settings', body),

    listFeedback: (p: { page?: number; status?: string }) =>
      api.get<Paginated<SupportTicket>>(`/admin/feedback${qs(p)}`),
    resolveFeedback: (id: string) => api.patch<{ ok: boolean }>(`/admin/feedback/${id}/resolve`),
  };
}
