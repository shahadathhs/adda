import type { Announcement, ChannelLink, Community } from "@/lib/types";
import { request } from "../client";

export const listAnnouncements = (communityId: string) =>
  request<Announcement[]>(`/api/communities/${communityId}/announcements`);

export const postAnnouncement = (communityId: string, body: string, pinned: boolean) =>
  request<Announcement>(`/api/communities/${communityId}/announcements`, {
    method: "POST",
    body: JSON.stringify({ body, pinned }),
  });

export const deleteAnnouncement = (communityId: string, id: string) =>
  request<void>(`/api/communities/${communityId}/announcements/${id}`, { method: "DELETE" });

export const setLinks = (communityId: string, links: ChannelLink[]) =>
  request<Community>(`/api/communities/${communityId}`, {
    method: "PATCH",
    body: JSON.stringify({ links }),
  });

export const uploadBanner = (communityId: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return request<Community>(`/api/communities/${communityId}/banner`, {
    method: "POST",
    body: form,
  });
};

export const removeBanner = (communityId: string) =>
  request<Community>(`/api/communities/${communityId}/banner`, { method: "DELETE" });
