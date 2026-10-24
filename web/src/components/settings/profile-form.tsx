"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile } from "@/lib/api";
import { describedBy } from "@/lib/field-aria";
import { sessionKeys } from "@/lib/session";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/primitives";

const BIO_MAX = 280;

/** Display name, username and bio. */
export function ProfileForm({ user }: { user: User }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    display_name: user.display_name,
    username: user.username,
    bio: user.bio ?? "",
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        display_name: form.display_name.trim(),
        username: form.username.trim(),
        bio: form.bio.trim() || null,
      }),
    onSuccess: (next) => {
      qc.setQueryData(sessionKeys.me, next);
      toast.success("Profile saved");
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Could not save";
      if (message.toLowerCase().includes("username")) setUsernameError(message);
      else toast.error(message);
    },
  });

  const dirty =
    form.display_name !== user.display_name ||
    form.username !== user.username ||
    form.bio !== (user.bio ?? "");

  return (
    <form
      className="space-y-5 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setUsernameError(null);
        save.mutate();
      }}
    >
      <UserAvatar
        name={form.display_name || user.username}
        src={user.avatar_url}
        className="h-16 w-16 text-xl"
      />
      <Field label="Display name" htmlFor="display_name">
        <Input
          id="display_name"
          required
          maxLength={100}
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </Field>
      <Field
        label="Username"
        htmlFor="username"
        help="Used in @mentions and your profile link."
        error={usernameError}
      >
        <Input
          id="username"
          required
          minLength={3}
          maxLength={50}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers and underscores only"
          value={form.username}
          onChange={(e) => {
            setForm({ ...form, username: e.target.value });
            setUsernameError(null);
          }}
          {...describedBy("username", true, usernameError)}
        />
      </Field>
      <Field
        label="Bio"
        htmlFor="bio"
        help={
          <span className="font-num">
            {form.bio.length}/{BIO_MAX}
          </span>
        }
      >
        <textarea
          id="bio"
          rows={3}
          maxLength={BIO_MAX}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground transition-colors duration-120 placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
      </Field>
      <div className="flex justify-end">
        <Button variant="primary" type="submit" disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
