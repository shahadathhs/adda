export type NotificationKind = "went_live" | "mention" | "reply";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  payload: {
    community_id: string;
    community_name: string;
    community_slug: string;
    title?: string | null;
    message_id?: string;
    from?: string;
    excerpt?: string;
  };
  read: boolean;
  created_at: string;
}

export interface NotificationList {
  items: AppNotification[];
  unread: number;
}

export interface NotificationPref {
  community_id: string | null;
  community_name?: string | null;
  bell: boolean;
  email: boolean;
}

export interface NotificationPrefs {
  email_available: boolean;
  default: NotificationPref;
  channels: NotificationPref[];
}
