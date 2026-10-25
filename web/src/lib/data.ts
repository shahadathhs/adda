"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  communityChannel,
  discoverChannels,
  followCommunity,
  getCommunity,
  getFollowState,
  recordings,
  socket,
  streamStatus,
  unfollowCommunity,
} from "@/lib/api";
import type { Community, Recording, StreamStatusPayload } from "@/lib/types";
import { apiBaseUrl } from "@/lib/config";
import { useEffect, useState } from "react";

export const webKeys = {
  discover: (q?: string) => ["discover", q ?? ""] as const,
  detail: (idOrSlug: string) => ["community", idOrSlug] as const,
  status: (id: string) => ["stream-status", id] as const,
  follow: (id: string) => ["follow", id] as const,
  followed: ["followed"] as const,
  recordings: (id: string) => ["recordings", id] as const,
};

/** Live frame (or offline poster) for a channel's stream card. */
export function thumbUrl(communityId: string) {
  return `${apiBaseUrl()}/api/streaming/communities/${communityId}/thumb`;
}

/**
 * The browse grid with instant live/offline transitions: subscribes to
 * every listed channel's community topic and applies `stream_status`
 * events in place — cards flip without a refetch.
 */
export function useLiveGrid<T extends { community_id: string; is_live: boolean; viewers: number }>(
  initial: T[],
): T[] {
  const [channels, setChannels] = useState<T[]>(initial);
  const key = initial
    .map((c) => c.community_id)
    .sort()
    .join(",");

  useEffect(() => {
    setChannels(initial);
    if (initial.length === 0) return;
    socket.connect();
    initial.forEach((c) => socket.subscribe(communityChannel(c.community_id)));
    const off = socket.on((msg) => {
      if (msg.type !== "stream_status" || !msg.data) return;
      const d = msg.data as unknown as StreamStatusPayload;
      setChannels((prev) =>
        prev.map((c) =>
          c.community_id === d.community_id ? { ...c, is_live: d.is_live, viewers: d.viewers } : c,
        ),
      );
    });
    return () => {
      off();
      initial.forEach((c) => socket.unsubscribe(communityChannel(c.community_id)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return channels;
}

export function useDiscover(q?: string) {
  return useQuery({
    queryKey: webKeys.discover(q),
    queryFn: () => discoverChannels(q),
  });
}

export function useCommunity(idOrSlug: string, initial?: Community) {
  return useQuery({
    queryKey: webKeys.detail(idOrSlug),
    queryFn: () => getCommunity(idOrSlug),
    initialData: initial,
  });
}

export function useStreamStatus(id: string) {
  return useQuery({
    queryKey: webKeys.status(id),
    queryFn: () => streamStatus(id),
    refetchInterval: 5000,
  });
}

export function useFollow(id: string, enabled: boolean) {
  return useQuery({
    queryKey: webKeys.follow(id),
    queryFn: () => getFollowState(id),
    enabled,
  });
}

export function useSetFollowed(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: webKeys.follow(id) });
    qc.invalidateQueries({ queryKey: webKeys.detail(id) });
    qc.invalidateQueries({ queryKey: webKeys.followed });
    qc.invalidateQueries({ queryKey: ["discover"] });
  };
  return {
    follow: useMutation({ mutationFn: () => followCommunity(id), onSuccess: invalidate }),
    unfollow: useMutation({ mutationFn: () => unfollowCommunity(id), onSuccess: invalidate }),
  };
}

export function useRecordings(id: string, enabled: boolean) {
  return useQuery({
    queryKey: webKeys.recordings(id),
    queryFn: () => recordings(id),
    enabled,
  });
}

/** Instant live/offline transitions for a channel page. */
export function useStreamEvents(id: string, onChange: () => void) {
  useEffect(() => {
    const channel = `community/${id}`;
    socket.connect();
    socket.subscribe(channel);
    const off = socket.on((msg) => {
      if (msg.type === "stream_status" && msg.channel === channel) onChange();
    });
    return () => {
      off();
      socket.unsubscribe(channel);
    };
  }, [id, onChange]);
}

export type { Recording };
