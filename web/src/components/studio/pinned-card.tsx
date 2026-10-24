"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { chatState, unpinMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

/** The pinned message, with Unpin. Pinning starts from the chat: hover a message, then ⋯ → Pin. */
export function PinnedCard({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["chat-state", communityId],
    queryFn: () => chatState(communityId),
  });
  const unpin = useMutation({
    mutationFn: () => unpinMessage(communityId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
      void qc.invalidateQueries({ queryKey: ["mod-actions", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not unpin"),
  });
  const pinned = state?.pinned;

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">Pinned message</h2>
      {pinned ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-background px-3.5 py-2.5">
          <Pin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 break-words text-sm text-foreground">
            <span className="font-semibold">{pinned.author.display_name}:</span> {pinned.content}
          </p>
          <Button variant="ghost" disabled={unpin.isPending} onClick={() => unpin.mutate()}>
            Unpin
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Nothing is pinned. In the chat, hover a message and choose ⋯ → Pin message.
        </p>
      )}
    </section>
  );
}
