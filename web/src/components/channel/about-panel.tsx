import type { Community } from "@/lib/types";
import { AnnouncementsList } from "@/components/channel/announcements-list";
import { LinksList } from "@/components/channel/links-list";

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

/** Right-hand column when offline: about text, links and announcements. */
export function AboutPanel({ community }: { community: Community }) {
  return (
    <div className="space-y-6 p-5">
      <section>
        <h2 className={eyebrow}>About</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {community.description || "This channel has not written an about text yet."}
        </p>
        {!!community.links?.length && (
          <div className="mt-3">
            <LinksList links={community.links} />
          </div>
        )}
      </section>
      <AnnouncementsList communityId={community.id} />
    </div>
  );
}
