"use client";

import { useQuery } from "@tanstack/react-query";
import { listAnnouncements } from "@/lib/api";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", day: "2-digit" });

/** Posts from the channel owner, pinned ones first. Renders nothing when there are none. */
export function AnnouncementsList({ communityId }: { communityId: string }) {
  const { data } = useQuery({
    queryKey: ["announcements", communityId],
    queryFn: () => listAnnouncements(communityId),
  });
  if (!data?.length) return null;
  return (
    <section aria-labelledby="announcements-h">
      <h2
        id="announcements-h"
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        Announcements
      </h2>
      <ul className="space-y-2.5">
        {data.map((a) => (
          <li key={a.id} className="rounded-md border border-border bg-card px-3.5 py-3">
            <p className="font-num text-xs text-muted-foreground">
              {date(a.created_at)}
              {a.pinned && " · pinned"}
            </p>
            <p className="mt-1.5 break-words text-[13px] leading-5 text-foreground">{a.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
