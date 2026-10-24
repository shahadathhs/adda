"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCommunity } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Name a channel; the address (slug) follows the name until you edit it. */
export function CreateChannelForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  const create = useMutation({
    mutationFn: () => createCommunity({ name: name.trim(), slug }),
    onSuccess: () => {
      toast.success("Channel created. Open Studio to get your stream key.");
      void qc.invalidateQueries();
      onDone();
      router.push("/dashboard?tab=studio");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the channel"),
  });

  return (
    <form
      className="space-y-2 rounded-md border border-border bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <Input
        required
        autoFocus
        placeholder="Channel name"
        aria-label="Channel name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugEdited) setSlug(slugify(e.target.value));
        }}
      />
      <Input
        required
        pattern="[a-z0-9\-]+"
        placeholder="address"
        aria-label="Channel address"
        value={slug}
        className="font-mono text-xs"
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(e.target.value);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
