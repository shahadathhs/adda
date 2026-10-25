"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateCommunity } from "@/lib/api";
import type { Community } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CopyField } from "@/components/studio/copy-field";

/** Name, stream title and about. The page address is fixed, so old links keep working. */
export function ChannelDetailsForm({ community }: { community: Community }) {
  const qc = useQueryClient();
  const initial = {
    name: community.name,
    stream_title: community.stream_title ?? "",
    description: community.description ?? "",
  };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () =>
      updateCommunity(community.id, {
        name: form.name.trim(),
        stream_title: form.stream_title.trim() || null,
        description: form.description.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Channel saved");
      void qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <form
      className="space-y-5 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h2 className="font-display text-base font-semibold text-foreground">Channel details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Channel name" htmlFor="name">
          <Input
            id="name"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div>
          <CopyField
            id="address"
            label="Page address"
            value={`${typeof window === "undefined" ? "" : window.location.origin}/channel/${community.slug}`}
          />
        </div>
      </div>
      <Field
        label="Stream title"
        htmlFor="stream_title"
        help="Shown on your channel while you are live."
      >
        <Input
          id="stream_title"
          maxLength={200}
          value={form.stream_title}
          onChange={(e) => setForm({ ...form, stream_title: e.target.value })}
        />
      </Field>
      <Field label="About" htmlFor="description">
        <textarea
          id="description"
          rows={4}
          maxLength={1000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={!dirty} onClick={() => setForm(initial)}>
          Discard
        </Button>
        <Button type="submit" variant="primary" disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
