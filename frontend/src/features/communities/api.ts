import { request } from "@/shared/api/client";
import type { User } from "@/features/auth/types";
import type { Community, StreamCredentials } from "./types";

export const listCommunities = () => request<Community[]>("/api/communities");

export const getCommunity = (id: string) => request<Community>(`/api/communities/${id}`);

export const createCommunity = (data: Partial<Community> & { name: string; slug: string }) =>
  request<Community>("/api/communities", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key`);

export const rotateStreamKey = (id: string) =>
  request<StreamCredentials>(`/api/communities/${id}/stream-key/rotate`, { method: "POST" });

export const joinCommunity = (id: string) =>
  request<User>(`/api/communities/${id}/members`, { method: "POST" });

export const leaveCommunity = (id: string) =>
  request<void>(`/api/communities/${id}/members`, { method: "DELETE" });
