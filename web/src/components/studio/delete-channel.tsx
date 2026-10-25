"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCommunity } from "@/lib/api";
import { useRecordings } from "@/lib/data";
import type { Community } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Danger zone: deleting needs the channel's name typed back. */
export function DeleteChannel({ community }: { community: Community }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const { data: recs } = useRecordings(community.id, true);
  const count = recs?.length ?? 0;

  const remove = useMutation({
    mutationFn: () => deleteCommunity(community.id),
    onSuccess: () => {
      toast.success("Channel deleted");
      void qc.invalidateQueries();
      router.push("/studio");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete the channel"),
  });

  return (
    <section className="rounded-md border border-destructive/60 bg-card p-5">
      <h2 className="font-display text-base font-semibold text-destructive">Delete channel</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Removes the channel, its {count} recording{count === 1 ? "" : "s"}, chat history and
        followers. This cannot be undone.
      </p>
      <div className="mt-4 flex gap-3">
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`Type ${community.name} to confirm`}
          aria-label={`Type ${community.name} to confirm deletion`}
          autoComplete="off"
        />
        <Button
          variant="danger"
          disabled={typed !== community.name || remove.isPending}
          onClick={() => remove.mutate()}
        >
          {remove.isPending ? "Deleting…" : "Delete channel"}
        </Button>
      </div>
    </section>
  );
}
