"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProfileCard({ user }: { user: User }) {
  const [form, setForm] = useState({
    display_name: user.display_name,
    username: user.username,
    bio: user.bio ?? "",
  });
  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        display_name: form.display_name,
        username: form.username,
        bio: form.bio || null,
      }),
    onSuccess: () => toast.success("Profile saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-display font-bold tracking-tight">Profile</h2>
      <Input
        placeholder="Display name"
        value={form.display_name}
        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        aria-label="Display name"
      />
      <Input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        aria-label="Username"
      />
      <Input
        placeholder="Bio"
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
        aria-label="Bio"
      />
      <Button variant="primary" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </Card>
  );
}
