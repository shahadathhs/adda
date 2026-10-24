"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { addModerator, listFollowers, listModerators, removeModerator } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

/** The owner's list of moderators, with a picker to add one from the channel's followers. */
export function ModeratorManager({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const [picked, setPicked] = useState("");
  const { data: moderators = [] } = useQuery({
    queryKey: ["moderators", communityId],
    queryFn: () => listModerators(communityId),
  });
  const { data: followers = [] } = useQuery({
    queryKey: ["followers", communityId],
    queryFn: () => listFollowers(communityId),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["moderators", communityId] });

  const add = useMutation({
    mutationFn: (userId: string) => addModerator(communityId, userId),
    onSuccess: () => {
      toast.success("Moderator added");
      setPicked("");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add moderator"),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeModerator(communityId, userId),
    onSuccess: () => {
      toast.success("Moderator removed");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove moderator"),
  });

  const moderatorIds = new Set(moderators.map((m) => m.user_id));
  const candidates = followers.filter((f) => !moderatorIds.has(f.id));

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border">
        {moderators.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 py-2.5">
            <UserAvatar name={m.display_name} src={m.avatar_url} className="h-8 w-8 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{m.display_name}</p>
              <p className="text-xs text-muted-foreground">@{m.username}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              title={`Remove ${m.display_name}`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(m.user_id)}
            >
              <UserMinus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}
        {moderators.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No moderators yet.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="moderator-pick">
          Choose a follower
        </label>
        <select
          id="moderator-pick"
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-sm border border-input bg-input/50 px-2 text-sm text-foreground"
        >
          <option value="">Choose a follower…</option>
          {candidates.map((f) => (
            <option key={f.id} value={f.id}>
              {f.display_name} (@{f.username})
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          disabled={!picked || add.isPending}
          onClick={() => add.mutate(picked)}
        >
          Make moderator
        </Button>
      </div>
    </div>
  );
}
