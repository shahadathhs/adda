"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { addModerator, listFollowers, listModerators } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

/** Search the channel's followers and make one a moderator. Only followers can be moderators. */
export function AddModerator({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: followers } = useQuery({
    queryKey: ["followers", communityId],
    queryFn: () => listFollowers(communityId),
  });
  const { data: mods } = useQuery({
    queryKey: ["moderators", communityId],
    queryFn: () => listModerators(communityId),
  });
  const add = useMutation({
    mutationFn: (userId: string) => addModerator(communityId, userId),
    onSuccess: () => {
      toast.success("Moderator added");
      void qc.invalidateQueries({ queryKey: ["moderators", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add moderator"),
  });

  const modIds = new Set(mods?.map((m) => m.user_id));
  const term = q.trim().toLowerCase();
  const matches = (followers ?? [])
    .filter((f) => !modIds.has(f.id))
    .filter(
      (f) =>
        !term ||
        f.username.toLowerCase().includes(term) ||
        f.display_name.toLowerCase().includes(term),
    )
    .slice(0, 6);

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">Add a moderator</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        Choose someone who follows your channel.
      </p>
      <div className="relative mt-4">
        <label htmlFor="mod-search" className="sr-only">
          Search followers
        </label>
        <input
          id="mod-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your followers"
          autoComplete="off"
          className="h-9 w-full rounded-sm border border-input bg-input/50 pl-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {followers && followers.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nobody follows this channel yet, so there is no one to choose.
        </p>
      ) : matches.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No follower matches “{q}”.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {matches.map((f) => (
            <li key={f.id} className="flex items-center gap-2.5 px-3 py-2">
              <UserAvatar
                name={f.display_name}
                src={f.avatar_url}
                className="h-7 w-7 text-[11px]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{f.username}</p>
                <p className="truncate text-xs text-muted-foreground">{f.display_name}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={add.isPending}
                onClick={() => add.mutate(f.id)}
              >
                Make mod
                <span className="sr-only"> {f.username}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
