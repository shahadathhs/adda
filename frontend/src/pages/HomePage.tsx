import { useState } from "react";
import { Link } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { useCommunities, useCreateCommunity } from "@/features/communities/hooks";

export default function HomePage() {
  const { data: communities = [], isLoading: loading } = useCommunities();
  const createMutation = useCreateCommunity();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ name: "", slug: "", description: "" });
        setCreating(false);
        toast.success("Community created");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
    });
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-muted-foreground">
            Join a hub — posts, chat, files, and live in one place.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>+ New</Button>
      </div>

      {creating && (
        <Card className="mb-6 p-4">
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="slug (lowercase, hyphens)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="sm:col-span-2"
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : communities.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No communities yet. Create the first one!
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <Link key={c.id} to="/community/$id" params={{ id: c.id }}>
              <Card className="cursor-pointer p-4 transition-colors hover:border-primary">
                <div className="flex items-start gap-3">
                  <UserAvatar name={c.name} src={c.avatar_url} className="h-12 w-12 text-base" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{c.name}</h3>
                      {c.is_live && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> LIVE
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {c.description || `@${c.slug}`}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{c.member_count} members</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
