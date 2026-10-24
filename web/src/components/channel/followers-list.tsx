"use client";

import { useQuery } from "@tanstack/react-query";
import { listFollowers } from "@/lib/api";
import { UserAvatar } from "@/components/ui/primitives";

/** Followers tab: avatar, name and handle. */
export function FollowersList({ communityId }: { communityId: string }) {
  const { data: followers, isPending } = useQuery({
    queryKey: ["followers", communityId],
    queryFn: () => listFollowers(communityId),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading followers…</p>;
  if (!followers?.length)
    return <p className="text-sm text-muted-foreground">No followers yet. Be the first.</p>;

  return (
    <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
      {followers.map((f) => (
        <li key={f.id} className="flex items-center gap-3 rounded-sm px-2 py-2">
          <UserAvatar name={f.display_name} src={f.avatar_url} className="h-8 w-8 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{f.display_name}</p>
            <p className="truncate text-xs text-muted-foreground">@{f.username}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
