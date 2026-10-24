import type { Community, Follower, Moderator, StreamCredentials } from "@/lib/types";
import { request } from "../client";

export const listCommunities = () => request<Community[]>("/api/communities");

/** Channels the current user owns or moderates. */
export const listMine = () => request<Community[]>("/api/communities/mine");

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

export const deleteCommunity = (id: string) =>
  request<void>(`/api/communities/${id}`, { method: "DELETE" });

export const getStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key`);

export const rotateStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key/rotate`, { method: "POST" });

export const getFollowState = (id: string) =>
  request<{ following: boolean }>(`/api/communities/${id}/follow`);

export const followCommunity = (id: string) =>
  request<{ following: boolean; follower_count: number }>(`/api/communities/${id}/follow`, {
    method: "POST",
  });

export const unfollowCommunity = (id: string) =>
  request<void>(`/api/communities/${id}/follow`, { method: "DELETE" });

export const listFollowed = () => request<Community[]>("/api/communities/followed/by-me");

export const listModerators = (id: string) =>
  request<Moderator[]>(`/api/communities/${id}/moderators`);

export const addModerator = (id: string, userId: string) =>
  request<Moderator>(`/api/communities/${id}/moderators`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

export const removeModerator = (id: string, userId: string) =>
  request<void>(`/api/communities/${id}/moderators/${userId}`, { method: "DELETE" });

export const listFollowers = (id: string) =>
  request<Follower[]>(`/api/communities/${id}/followers`);
