import { useQuery } from "@tanstack/react-query";
import { discoverChannels, streamHealth, streamStatus } from "./api";

export const discoverKeys = {
  all: ["discover"] as const,
  list: (q?: string) => [...discoverKeys.all, q ?? ""] as const,
};

/**
 * Polls a community's live status. Pass `enabled` to gate polling (e.g. only
 * while the Live tab is open). Refetches every 5s.
 */
export const useStreamStatus = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["stream-status", id],
    queryFn: () => streamStatus(id),
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });

/** Public browse grid: live channels first (by viewers), then the rest. */
export const useDiscover = (q?: string) =>
  useQuery({
    queryKey: discoverKeys.list(q),
    queryFn: () => discoverChannels(q),
    refetchInterval: 15000,
  });

/** Owner-only live health snapshot for the streamer dashboard. */
export const useStreamHealth = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ["stream-health", id],
    queryFn: () => streamHealth(id),
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
