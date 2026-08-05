import { API_BASE_URL } from "../config";
import type {
  AdminCommunity,
  AdminMember,
  AdminStats,
  AdminUser,
  Community,
  LiveStream,
  Recording,
  StreamCredentials,
  Token,
  User,
} from "../types";

const TOKEN_KEY = "adda_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (resp.status === 204) {
    return undefined as T;
  }
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return resp.json() as Promise<T>;
}

// ── Auth ──
export const api = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name: string;
  }) => request<Token>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) =>
    request<Token>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/api/auth/me"),

  // ── Communities ──
  listCommunities: () => request<Community[]>("/api/communities"),
  getCommunity: (id: string) => request<Community>(`/api/communities/${id}`),
  createCommunity: (data: Partial<Community> & { name: string; slug: string }) =>
    request<Community>("/api/communities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStreamKey: (id: string) =>
    request<StreamCredentials>(`/api/communities/${id}/stream-key`),
  rotateStreamKey: (id: string) =>
    request<StreamCredentials>(
      `/api/communities/${id}/stream-key/rotate`,
      { method: "POST" }
    ),

  // ── Admin ──
  adminStats: () => request<AdminStats>("/api/admin/stats"),
  adminUsers: (q?: string) =>
    request<AdminUser[]>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  adminUpdateUser: (id: string, data: { is_admin?: boolean; is_active?: boolean }) =>
    request<AdminUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminResetUserPassword: (id: string, password: string) =>
    request<void>(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  adminDeleteUser: (id: string) =>
    request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),

  adminCommunities: () => request<AdminCommunity[]>("/api/admin/communities"),
  adminUpdateCommunity: (
    id: string,
    data: { is_suspended?: boolean; name?: string; description?: string; is_private?: boolean }
  ) =>
    request<AdminCommunity>(`/api/admin/communities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminCommunityMembers: (id: string) =>
    request<AdminMember[]>(`/api/admin/communities/${id}/members`),
  adminKickMember: (communityId: string, userId: string) =>
    request<void>(`/api/admin/communities/${communityId}/members/${userId}`, {
      method: "DELETE",
    }),
  adminCommunityStreamKey: (id: string) =>
    request<StreamCredentials>(`/api/admin/communities/${id}/stream-key`),
  adminRotateCommunityKey: (id: string) =>
    request<StreamCredentials>(
      `/api/admin/communities/${id}/stream-key/rotate`,
      { method: "POST" }
    ),
  adminStopStream: (id: string) =>
    request<void>(`/api/admin/communities/${id}/stop`, { method: "POST" }),
  adminDeleteCommunity: (id: string) =>
    request<void>(`/api/admin/communities/${id}`, { method: "DELETE" }),

  adminLive: () => request<LiveStream[]>("/api/admin/live"),

  adminRecordings: (communityId?: string) =>
    request<Recording[]>(
      `/api/admin/recordings${communityId ? `?community_id=${communityId}` : ""}`
    ),
  adminDeleteRecording: (path: string) =>
    request<void>(`/api/admin/recordings?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    }),

  // ── Membership ──
  joinCommunity: (id: string) =>
    request<User>(`/api/communities/${id}/members`, { method: "POST" }),
  leaveCommunity: (id: string) =>
    request<void>(`/api/communities/${id}/members`, { method: "DELETE" }),

  // ── Recordings (community VODs) ──
  recordings: (communityId: string) =>
    request<Recording[]>(`/api/recordings?community_id=${communityId}`),

  // ── Streaming ──
  streamStatus: (id: string) =>
    request<{ is_live: boolean; hls_url: string; rtmp_ingest_url: string }>(
      `/api/streaming/communities/${id}/status`
    ),
};
