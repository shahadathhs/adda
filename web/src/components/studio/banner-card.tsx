"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { removeBanner, uploadBanner } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import type { Community } from "@/lib/types";
import { Button } from "@/components/ui/button";

/** The channel banner: preview, upload and remove. */
export function BannerCard({ community }: { community: Community }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const done = () => void qc.invalidateQueries();
  const upload = useMutation({
    mutationFn: (file: File) => uploadBanner(community.id, file),
    onSuccess: () => {
      toast.success("Banner saved");
      done();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not upload the banner"),
  });
  const remove = useMutation({ mutationFn: () => removeBanner(community.id), onSuccess: done });

  const src = mediaUrl(community.banner_url);

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">Banner</h2>
      <div className="mt-3 grid aspect-[15/4] place-items-center overflow-hidden rounded-md border border-border bg-background">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground/80">
        PNG, JPEG or WebP, up to 2 MB. About 1500 × 400 px works well.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Choose a banner image"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload.mutate(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          {upload.isPending ? "Uploading…" : src ? "Replace" : "Upload banner"}
        </Button>
        {src && (
          <Button variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
            Remove
          </Button>
        )}
      </div>
    </section>
  );
}
