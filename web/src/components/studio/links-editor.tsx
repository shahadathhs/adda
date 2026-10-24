"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { setLinks } from "@/lib/api";
import type { ChannelLink, Community } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX = 5;

/** Up to five links shown on the channel page. Only http and https addresses are accepted. */
export function LinksEditor({ community }: { community: Community }) {
  const qc = useQueryClient();
  const initial = community.links ?? [];
  const [links, setList] = useState<ChannelLink[]>(initial);
  const dirty = JSON.stringify(links) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () =>
      setLinks(
        community.id,
        links.filter((l) => l.label.trim() && l.url.trim()),
      ),
    onSuccess: () => {
      toast.success("Links saved");
      void qc.invalidateQueries();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Links need a label and an http(s) address"),
  });
  const edit = (i: number, patch: Partial<ChannelLink>) =>
    setList(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">Links</h2>
      <ul className="mt-3 space-y-2">
        {links.map((l, i) => (
          <li key={i} className="flex gap-2">
            <Input
              aria-label={`Link ${i + 1} label`}
              placeholder="Label"
              maxLength={40}
              value={l.label}
              onChange={(e) => edit(i, { label: e.target.value })}
              className="max-w-[10rem]"
            />
            <Input
              aria-label={`Link ${i + 1} address`}
              placeholder="https://"
              maxLength={300}
              value={l.url}
              onChange={(e) => edit(i, { url: e.target.value })}
            />
            <Button
              variant="ghost"
              onClick={() => setList(links.filter((_, j) => j !== i))}
              aria-label={`Remove link ${i + 1}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        {links.length < MAX ? (
          <button
            type="button"
            onClick={() => setList([...links, { label: "", url: "" }])}
            className="flex items-center gap-1.5 text-[13px] text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add link
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Up to {MAX} links.</span>
        )}
        <Button variant="primary" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save links"}
        </Button>
      </div>
    </section>
  );
}
