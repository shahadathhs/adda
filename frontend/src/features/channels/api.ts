import { request } from "@/shared/api/client";
import type { Channel, ChannelMember, ChannelMessage } from "./types";

export const listChannels = (communityId: string) =>
  request<Channel[]>(`/api/communities/${communityId}/channels`);

export const createChannel = (
  communityId: string,
  data: {
    name: string;
    slug: string;
    type?: string;
    position?: number;
    is_restricted?: boolean;
  },
) =>
  request<Channel>(`/api/communities/${communityId}/channels`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateChannel = (
  communityId: string,
  channelId: string,
  data: { name?: string; position?: number; is_restricted?: boolean },
) =>
  request<Channel>(`/api/communities/${communityId}/channels/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteChannel = (communityId: string, channelId: string) =>
  request<void>(`/api/communities/${communityId}/channels/${channelId}`, {
    method: "DELETE",
  });

export const listMessages = (communityId: string, channelId: string, before?: string) =>
  request<ChannelMessage[]>(
    `/api/communities/${communityId}/channels/${channelId}/messages` +
      (before ? `?before=${before}` : ""),
  );

export const deleteMessage = (communityId: string, channelId: string, messageId: string) =>
  request<void>(`/api/communities/${communityId}/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
  });

export const listChannelMembers = (communityId: string, channelId: string) =>
  request<ChannelMember[]>(`/api/communities/${communityId}/channels/${channelId}/members`);

export const addChannelMember = (
  communityId: string,
  channelId: string,
  data: { user_id: string; can_read?: boolean; can_write?: boolean },
) =>
  request<ChannelMember>(`/api/communities/${communityId}/channels/${channelId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const removeChannelMember = (communityId: string, channelId: string, userId: string) =>
  request<void>(`/api/communities/${communityId}/channels/${channelId}/members/${userId}`, {
    method: "DELETE",
  });
