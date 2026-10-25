"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listMine } from "@/lib/api";
import type { Community } from "@/lib/types";

/**
 * The channels you can manage and the one selected by `?channel=<id>`
 * (the first when none is chosen).
 */
export function useStudioChannel(): {
  channels: Community[];
  channel: Community | undefined;
  isPending: boolean;
  search: string;
} {
  const selected = useSearchParams().get("channel");
  const { data = [], isPending } = useQuery({ queryKey: ["mine"], queryFn: listMine });
  const channel = data.find((c) => c.id === selected) ?? data[0];
  return {
    channels: data,
    channel,
    isPending,
    search: channel && data.length > 1 ? `?channel=${channel.id}` : "",
  };
}
