import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/ui/form";
import { useCommunities, useCreateCommunity } from "@/features/communities/hooks";
import { createCommunitySchema, type CreateCommunityValues } from "@/features/communities/schemas";

export default function HomePage() {
  const { data: communities = [], isLoading: loading } = useCommunities();
  const createMutation = useCreateCommunity();
  const [creating, setCreating] = useState(false);
  const form = useForm<CreateCommunityValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const create = (values: CreateCommunityValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        form.reset({ name: "", slug: "", description: "" });
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(create)} className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="slug (lowercase, hyphens)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
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
