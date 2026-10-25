"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteEmote, listEmotes } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import { Button } from "@/components/ui/button";

const LIMIT = 50;

/** The channel's emotes, with Remove. */
export function EmoteGrid({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: emotes, isPending } = useQuery({
    queryKey: ["emotes", communityId],
    queryFn: () => listEmotes(communityId),
  });
  const remove = useMutation({
    mutationFn: (name: string) => deleteEmote(communityId, name),
    onSuccess: () => {
      toast.success("Emote removed. Chat shows its name as plain text.");
      void qc.invalidateQueries({ queryKey: ["emotes", communityId] });
      void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove"),
  });

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Your emotes</h2>
        <span className="text-[13px] text-muted-foreground">
          <span className="font-num">{emotes?.length ?? 0}</span> of{" "}
          <span className="font-num">{LIMIT}</span>
        </span>
      </div>
      {isPending ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Loading emotes…
        </p>
      ) : !emotes?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No emotes yet. Add one and viewers can use it in chat by typing its name between colons.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {emotes.map((e) => (
            <li
              key={e.name}
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-background p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(e.url) ?? e.url} alt="" className="h-12 w-12 object-contain" />
              <span className="font-num text-xs text-foreground">:{e.name}:</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(e.name)}
              >
                Remove<span className="sr-only"> :{e.name}:</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
