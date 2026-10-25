"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationsRead, socket } from "@/lib/api";
import { useMe } from "@/lib/session";

const KEY = ["notifications"] as const;

/** The bell's data: the list and unread count, kept fresh by live `notification` events. */
export function useNotifications() {
  const { data: user } = useMe();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => listNotifications(), enabled: !!user });

  useEffect(() => {
    if (!user) return;
    socket.connect();
    return socket.on((msg) => {
      if (msg.type === "notification") void qc.invalidateQueries({ queryKey: KEY });
    });
  }, [user, qc]);

  const markRead = useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    items: query.data?.items ?? [],
    unread: query.data?.unread ?? 0,
    isPending: query.isPending && !!user,
    markRead: (ids?: string[]) => markRead.mutate(ids),
  };
}
