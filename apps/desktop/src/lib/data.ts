import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  adminCommunities,
  adminLive,
  adminStats,
  communityChannel,
  getStreamKey,
  listMembers,
  listMine,
  recordings,
  socket,
  streamHealth,
  streamStatus,
} from "@adda/api-client";
import { notify } from "./notify";

export const consoleKeys = {
  mine: ["channels", "mine"] as const,
  status: (id: string) => ["stream-status", id] as const,
  health: (id: string) => ["stream-health", id] as const,
  streamKey: (id: string) => ["stream-key", id] as const,
  members: (id: string) => ["members", id] as const,
  channelRecordings: (id: string) => ["recordings", id] as const,
  followed: ["followed"] as const,
  stats: ["console", "stats"] as const,
  live: ["console", "live"] as const,
  communities: ["console", "communities"] as const,
  users: (q: string) => ["console", "users", q] as const,
  adminRecordings: (communityId?: string) =>
    ["console", "recordings", communityId ?? "all"] as const,
};

/** Channels where the signed-in user holds a creator/moderator role. */
export function useMyChannels() {
  return useQuery({ queryKey: consoleKeys.mine, queryFn: listMine });
}

export function useChannelStatus(id: string | undefined) {
  return useQuery({
    queryKey: consoleKeys.status(id ?? ""),
    queryFn: () => streamStatus(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useChannelHealth(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: consoleKeys.health(id ?? ""),
    queryFn: () => streamHealth(id!),
    enabled: !!id && enabled,
    refetchInterval: 5000,
  });
}

export function useStreamCreds(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: consoleKeys.streamKey(id ?? ""),
    queryFn: () => getStreamKey(id!),
    enabled: !!id && enabled,
  });
}

export function useChannelMembers(id: string | undefined) {
  return useQuery({
    queryKey: consoleKeys.members(id ?? ""),
    queryFn: () => listMembers(id!),
    enabled: !!id,
  });
}

export function useChannelRecordings(id: string | undefined) {
  return useQuery({
    queryKey: consoleKeys.channelRecordings(id ?? ""),
    queryFn: () => recordings(id!),
    enabled: !!id,
  });
}

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
 * Realtime wiring: subscribe to channels of interest and react to live/offline
 * transitions — native notification + instant data refresh. Subscribes to the
 * user's own channels, plus (for system staff) every channel on the instance.
 */
export function useStreamEvents(enabled: boolean, watchAll: boolean) {
  const qc = useQueryClient();
  const { data: mine = [] } = useMyChannels();
  const { data: all = [] } = useAdminCommunities();
  const channels = useMemo(() => (watchAll ? all : mine), [watchAll, all, mine]);
  const channelList = channels;
  const names = useRef(new Map<string, string>());

  useEffect(() => {
    if (!enabled) return;
    names.current = new Map(channelList.map((c) => [c.id, c.name]));
  }, [channelList, enabled]);

  useEffect(() => {
    if (!enabled) return;
    socket.connect();
    const off = socket.on((msg) => {
      if (msg.type !== "stream_status" || !msg.channel) return;
      const data = msg.data as { community_id?: string; is_live?: boolean };
      const cid = data.community_id ?? msg.channel.split(/[/:]/)[1];
      const name = names.current.get(cid) ?? "A channel";
      if (data.is_live) {
        notify(`${name} is live`, "Manage it from the console.");
      } else {
        toast(`${name} went offline`);
      }
      qc.invalidateQueries({ queryKey: consoleKeys.live });
      qc.invalidateQueries({ queryKey: consoleKeys.stats });
      qc.invalidateQueries({ queryKey: consoleKeys.mine });
      qc.invalidateQueries({ queryKey: consoleKeys.status(cid) });
    });
    return off;
  }, [enabled, qc]);

  // (Re)subscribe to channels whenever the list changes.
  useEffect(() => {
    if (!enabled) return;
    socket.connect();
    for (const c of channelList) socket.subscribe(communityChannel(c.id));
    return () => {
      for (const c of channelList) socket.unsubscribe(communityChannel(c.id));
    };
  }, [enabled, channelList]);
}
