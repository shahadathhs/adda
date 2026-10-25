"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { removeAvatar, uploadAvatar } from "@/lib/api";
import { sessionKeys } from "@/lib/session";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

/** The profile picture: preview, upload and remove. Saves on its own, apart from the form. */
export function AvatarEditor({ user }: { user: User }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const saved = (next: User) => qc.setQueryData(sessionKeys.me, next);

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (next) => {
      saved(next);
      toast.success("Picture saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not upload the picture"),
  });
  const remove = useMutation({
    mutationFn: removeAvatar,
    onSuccess: (next) => {
      saved(next);
      toast.success("Picture removed");
    },
  });

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        name={user.display_name || user.username}
        src={user.avatar_url}
        className="h-16 w-16 text-xl"
      />
      <div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Choose a profile picture"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload.mutate(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
          >
            {upload.isPending
              ? "Uploading…"
              : user.avatar_url
                ? "Replace picture"
                : "Upload picture"}
          </Button>
          {user.avatar_url && (
            <Button
              type="button"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground/80">PNG, JPEG or WebP, up to 2 MB.</p>
      </div>
    </div>
  );
}
