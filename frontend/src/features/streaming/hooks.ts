import { useQuery } from "@tanstack/react-query";
import { streamStatus } from "./api";

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
