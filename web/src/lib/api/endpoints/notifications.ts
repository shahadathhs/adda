import type { NotificationList, NotificationPref, NotificationPrefs } from "@/lib/types";
import { request } from "../client";

export const listNotifications = (limit = 30) =>
  request<NotificationList>(`/api/notifications?limit=${limit}`);

/** Mark some notifications read, or all of them when no ids are given. */
export const markNotificationsRead = (ids?: string[]) =>
  request<{ unread: number }>("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify(ids ? { ids } : {}),
  });

export const notificationPrefs = () => request<NotificationPrefs>("/api/me/notification-prefs");

export const setNotificationPref = (data: {
  community_id?: string | null;
  bell?: boolean;
  email?: boolean;
}) =>
  request<NotificationPref>("/api/me/notification-prefs", {
    method: "PUT",
    body: JSON.stringify(data),
  });
