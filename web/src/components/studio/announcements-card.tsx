"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAnnouncement, listAnnouncements, postAnnouncement } from "@/lib/api";
import { Button } from "@/components/ui/button";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", day: "2-digit" });

/** Post to the channel page and manage what is already there. */
export function AnnouncementsCard({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(true);
  const { data: items } = useQuery({
    queryKey: ["announcements", communityId],
    queryFn: () => listAnnouncements(communityId),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["announcements", communityId] });
  const post = useMutation({
    mutationFn: () => postAnnouncement(communityId, body.trim(), pinned),
    onSuccess: () => {
      setBody("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(communityId, id),
    onSuccess: refresh,
  });

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">Post an announcement</h2>
      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          post.mutate();
        }}
      >
        <label htmlFor="announcement" className="sr-only">
          Announcement
        </label>
        <textarea
          id="announcement"
          rows={3}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share news with your followers…"
          className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-foreground">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Pin to my channel page
          </label>
          <Button type="submit" variant="primary" disabled={!body.trim() || post.isPending}>
            Post
          </Button>
        </div>
      </form>

      {!!items?.length && (
        <ul className="mt-4 space-y-3 border-t border-border pt-4">
          {items.map((a) => (
            <li key={a.id} className="text-[13px]">
              <p className="flex items-center justify-between font-num text-xs text-muted-foreground">
                <span>
                  {date(a.created_at)}
                  {a.pinned && " · pinned"}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(a.id)}
                  className="font-sans hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Delete<span className="sr-only"> announcement</span>
                </button>
              </p>
              <p className="mt-0.5 break-words text-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
