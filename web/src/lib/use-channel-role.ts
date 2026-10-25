"use client";

import { useQuery } from "@tanstack/react-query";
import { listMine } from "@/lib/api";
import { useMe } from "@/lib/session";

export type ChannelRole = "owner" | "moderator" | "staff" | null;

/** The signed-in account's moderation power on a channel: owner, moderator, staff, or none. */
export function useChannelRole(communityId: string): ChannelRole {
  const { data: user } = useMe();
  const { data: mine } = useQuery({
    queryKey: ["mine"],
    queryFn: listMine,
    enabled: !!user,
  });
  if (!user) return null;
  const role = mine?.find((c) => c.id === communityId)?.my_role;
  if (role === "owner" || role === "moderator") return role;
  return user.system_role === "user" ? null : "staff";
}

/** Owners, moderators and staff can delete, pin, time out and reveal. */
export const canModerate = (role: ChannelRole): boolean => role !== null;
