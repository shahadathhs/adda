import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  adminCommunities,
  adminLive,
  adminStats,
  communityChannel,
  socket,
} from "@adda/api-client";
import { notify } from "./notify";

export const consoleKeys = {
  stats: ["console", "stats"] as const,
  live: ["console", "live"] as const,
  communities: ["console", "communities"] as const,
  users: (q: string) => ["console", "users", q] as const,
  recordings: (communityId?: string) => ["console", "recordings", communityId ?? "all"] as const,
  members: (communityId: string) => ["console", "members", communityId] as const,
  streamKey: (communityId: string) => ["console", "stream-key", communityId] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: consoleKeys.stats,
    queryFn: adminStats,
    refetchInterval: 15_000,
  });
}

export function useAdminLive() {
  return useQuery({
    queryKey: consoleKeys.live,
    queryFn: adminLive,
    refetchInterval: 5_000,
  });
}

export function useAdminCommunities() {
  return useQuery({ queryKey: consoleKeys.communities, queryFn: adminCommunities });
}

/**
 * Realtime wiring: subscribe to every community's event channel and react to
 * live/offline transitions — native notification + instant data refresh.
 */
export function useStreamEvents(enabled: boolean) {
  const qc = useQueryClient();
  const { data: communities } = useAdminCommunities();
  const names = useRef(new Map<string, string>());

  useEffect(() => {
    if (!enabled) return;
    names.current = new Map((communities ?? []).map((c) => [c.id, c.name]));
  }, [communities, enabled]);

  useEffect(() => {
    if (!enabled) return;
    socket.connect();
    const off = socket.on((msg) => {
      if (msg.type !== "stream_status" || !msg.channel) return;
      const data = msg.data as { community_id?: string; is_live?: boolean };
      const cid = data.community_id ?? msg.channel.split(":")[1];
      const name = names.current.get(cid) ?? "A channel";
      if (data.is_live) {
        notify(`${name} is live`, "Open the web app to watch, or manage it from Streams.");
      } else {
        toast(`${name} went offline`);
      }
      qc.invalidateQueries({ queryKey: consoleKeys.live });
      qc.invalidateQueries({ queryKey: consoleKeys.stats });
      qc.invalidateQueries({ queryKey: consoleKeys.communities });
    });
    return off;
  }, [enabled, qc]);

  // (Re)subscribe to every community channel whenever the list changes.
  useEffect(() => {
    if (!enabled || !communities) return;
    socket.connect();
    for (const c of communities) socket.subscribe(communityChannel(c.id));
    return () => {
      for (const c of communities) socket.unsubscribe(communityChannel(c.id));
    };
  }, [enabled, communities]);
}
