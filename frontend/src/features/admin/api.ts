import { request } from "@/shared/api/client";
import type { StreamCredentials } from "@/features/communities/types";
import type { Recording } from "@/features/recordings/types";
import type { AdminCommunity, AdminMember, AdminStats, AdminUser, LiveStream } from "./types";

// ── Stats ──
export const adminStats = () => request<AdminStats>("/api/admin/stats");

// ── Users ──
export const adminUsers = (q?: string) =>
  request<AdminUser[]>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const adminUpdateUser = (id: string, data: { system_role?: string; is_active?: boolean }) =>
  request<AdminUser>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const adminResetUserPassword = (id: string, password: string) =>
  request<void>(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const adminDeleteUser = (id: string) =>
  request<void>(`/api/admin/users/${id}`, { method: "DELETE" });

// ── Communities ──
export const adminCommunities = () => request<AdminCommunity[]>("/api/admin/communities");

export const adminUpdateCommunity = (
  id: string,
  data: {
    is_suspended?: boolean;
    name?: string;
    description?: string;
    is_private?: boolean;
  },
) =>
  request<AdminCommunity>(`/api/admin/communities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const adminCommunityMembers = (id: string) =>
  request<AdminMember[]>(`/api/admin/communities/${id}/members`);

export const adminKickMember = (communityId: string, userId: string) =>
  request<void>(`/api/admin/communities/${communityId}/members/${userId}`, {
    method: "DELETE",
  });

export const adminCommunityStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/admin/communities/${id}/stream-key`);

export const adminRotateCommunityKey = (id: string) =>
  request<StreamCredentials>(`/api/admin/communities/${id}/stream-key/rotate`, {
    method: "POST",
  });

export const adminStopStream = (id: string) =>
  request<void>(`/api/admin/communities/${id}/stop`, { method: "POST" });

export const adminDeleteCommunity = (id: string) =>
  request<void>(`/api/admin/communities/${id}`, { method: "DELETE" });

// ── Live ──
export const adminLive = () => request<LiveStream[]>("/api/admin/live");

// ── Recordings ──
export const adminRecordings = (communityId?: string) =>
  request<Recording[]>(`/api/admin/recordings${communityId ? `?community_id=${communityId}` : ""}`);

export const adminDeleteRecording = (path: string) =>
  request<void>(`/api/admin/recordings?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
