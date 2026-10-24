"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadEmote } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { describedBy } from "@/lib/field-aria";

const NAME = /^[a-z0-9_]{2,24}$/;

/** Add an emote: a name and an image, with the limits stated up front and a live preview. */
export function EmoteUpload({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () => uploadEmote(communityId, name, file!),
    onSuccess: () => {
      toast.success(`:${name}: added`);
      setName("");
      setFile(null);
      setPreview(null);
      if (input.current) input.current.value = "";
      void qc.invalidateQueries({ queryKey: ["emotes", communityId] });
      void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add the emote"),
  });

  const pick = (f: File | null) => {
    setError(null);
    setFile(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };
  const nameOk = NAME.test(name);

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        add.mutate();
      }}
    >
      <h2 className="font-display text-base font-semibold text-foreground">Add an emote</h2>
      <Field
        label="Image"
        htmlFor="emote-file"
        help="PNG, GIF or WebP, up to 256 KB and 128 × 128 px."
      >
        <input
          id="emote-file"
          ref={input}
          type="file"
          accept="image/png,image/gif,image/webp"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-sm file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
      </Field>
      <Field
        label="Name"
        htmlFor="emote-name"
        help="Letters, numbers and underscores. People type it as :name:"
        error={error}
      >
        <Input
          id="emote-name"
          required
          maxLength={24}
          value={name}
          onChange={(e) => {
            setName(e.target.value.toLowerCase());
            setError(null);
          }}
          {...describedBy("emote-name", true, error)}
        />
      </Field>
      {preview && (
        <div className="rounded-md border border-border bg-background p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Preview
          </p>
          <p className="text-[13px] text-foreground">
            <span className="font-semibold text-muted-foreground">you</span>: nice one{" "}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="inline-block h-5 w-5 align-text-bottom" />
          </p>
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!file || !nameOk || add.isPending}
      >
        {add.isPending ? "Adding…" : "Add emote"}
      </Button>
    </form>
  );
}
