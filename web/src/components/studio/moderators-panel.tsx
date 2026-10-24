"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listModerators, removeModerator } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

const month = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", year: "numeric" });

/** The channel's moderators, with who they are, since when, and a Remove button. */
export function ModeratorsPanel({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: mods, isPending } = useQuery({
    queryKey: ["moderators", communityId],
    queryFn: () => listModerators(communityId),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeModerator(communityId, userId),
    onSuccess: () => {
      toast.success("Moderator removed");
      void qc.invalidateQueries({ queryKey: ["moderators", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove"),
  });

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">
        Moderators
        {mods && (
          <span className="ml-2 font-num text-sm font-medium text-muted-foreground">
            {mods.length}
          </span>
        )}
      </h2>

      {isPending || !mods ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Loading moderators…
        </p>
      ) : mods.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No moderators yet. Choose someone who follows your channel.
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-2 font-semibold">Member</th>
              <th className="py-2 font-semibold">Since</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {mods.map((m) => (
              <tr key={m.user_id} className="border-b border-border last:border-b-0">
                <td className="py-2.5">
                  <span className="flex items-center gap-2.5">
                    <UserAvatar
                      name={m.display_name}
                      src={m.avatar_url}
                      className="h-7 w-7 text-[11px]"
                    />
                    <span className="font-medium text-foreground">{m.username}</span>
                    <span className="rounded-xs bg-ok/15 px-1.5 text-[10px] font-semibold uppercase leading-[14px] tracking-[0.03em] text-ok">
                      Mod
                    </span>
                  </span>
                </td>
                <td className="py-2.5 font-num text-[13px] text-muted-foreground">
                  {month(m.since)}
                </td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(m.user_id)}
                  >
                    Remove
                    <span className="sr-only"> {m.username}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-4 text-xs leading-5 text-muted-foreground/80">
        Moderators can delete messages and see who is behind “Anonymous” messages. They can&apos;t
        change channel settings or see your stream key.
      </p>
    </section>
  );
}
