"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { browseChannels, browseRecordings, globalSearch } from "@/lib/api";
import type { ChannelQuery, RecordingQuery } from "@/lib/types";

/** `value`, but only after it has stopped changing for `ms`. */
export function useDebounced<T>(value: T, ms = 200): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}

/** One page of channels. The previous page stays on screen while the next loads. */
export function useBrowseChannels(query: ChannelQuery, enabled = true) {
  return useQuery({
    queryKey: ["browse", "channels", query],
    queryFn: () => browseChannels(query),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
    enabled,
  });
}

export function useBrowseRecordings(query: RecordingQuery, enabled = true) {
  return useQuery({
    queryKey: ["browse", "recordings", query],
    queryFn: () => browseRecordings(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGlobalSearch(q: string, limit = 5) {
  return useQuery({
    queryKey: ["search", q, limit],
    queryFn: () => globalSearch(q, limit),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
