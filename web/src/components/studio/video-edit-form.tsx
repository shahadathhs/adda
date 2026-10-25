"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateVideo } from "@/lib/api";
import type { Video } from "@/lib/types";
import { videoKeys } from "@/lib/use-videos";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VisibilitySelect } from "@/components/studio/visibility-select";

/** Change a video's title, description and who can watch it. */
export function VideoEditForm({ video, onDone }: { video: Video; onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [visibility, setVisibility] = useState(video.visibility);

  const save = useMutation({
    mutationFn: () =>
      updateVideo(video.id, {
        title: title.trim(),
        description: description.trim() || null,
        visibility,
      }),
    onSuccess: () => {
      toast.success("Video saved");
      void qc.invalidateQueries({ queryKey: videoKeys.channel(video.community_id) });
      void qc.invalidateQueries({ queryKey: videoKeys.one(video.id) });
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the video"),
  });

  return (
    <form
      className="space-y-3 border-t border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Field label="Title" htmlFor={`title-${video.id}`}>
        <Input
          id={`title-${video.id}`}
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Description" htmlFor={`desc-${video.id}`}>
        <textarea
          id={`desc-${video.id}`}
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
      </Field>
      <Field label="Who can watch" htmlFor={`vis-${video.id}`}>
        <VisibilitySelect id={`vis-${video.id}`} value={visibility} onChange={setVisibility} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!title.trim() || save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
