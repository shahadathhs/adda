import { request } from "@/shared/api/client";
import type { Community, JoinRequestOut, MemberOut, StreamCredentials } from "./types";

export const listCommunities = () => request<Community[]>("/api/communities");

export const getCommunity = (id: string) => request<Community>(`/api/communities/${id}`);

export const createCommunity = (data: Partial<Community> & { name: string; slug: string }) =>
  request<Community>("/api/communities", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateCommunity = (id: string, data: Partial<Community>) =>
  request<Community>(`/api/communities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const getFollowState = (id: string) =>
  request<{ following: boolean }>(`/api/communities/${id}/follow`);

export const followCommunity = (id: string) =>
  request<{ following: boolean; follower_count: number }>(`/api/communities/${id}/follow`, {
    method: "POST",
  });

export const unfollowCommunity = (id: string) =>
  request<void>(`/api/communities/${id}/follow`, { method: "DELETE" });

export const listFollowed = () => request<Community[]>("/api/communities/followed/by-me");

export const getStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key`);

export const rotateStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key/rotate`, { method: "POST" });

export const joinCommunity = (id: string) =>
  request<{ status: string }>(`/api/communities/${id}/members`, {
    method: "POST",
  });

export const leaveCommunity = (id: string) =>
  request<void>(`/api/communities/${id}/members`, { method: "DELETE" });

export const listMembers = (id: string) => request<MemberOut[]>(`/api/communities/${id}/members`);

export const updateMemberRole = (id: string, userId: string, role: string) =>
  request<MemberOut>(`/api/communities/${id}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const kickMember = (id: string, userId: string) =>
  request<void>(`/api/communities/${id}/members/${userId}`, {
    method: "DELETE",
  });

export const listJoinRequests = (id: string) =>
  request<JoinRequestOut[]>(`/api/communities/${id}/join-requests`);

export const approveJoinRequest = (id: string, requestId: string) =>
  request<MemberOut>(`/api/communities/${id}/join-requests/${requestId}/approve`, {
    method: "POST",
  });

export const denyJoinRequest = (id: string, requestId: string) =>
  request<void>(`/api/communities/${id}/join-requests/${requestId}/deny`, {
    method: "POST",
  });
