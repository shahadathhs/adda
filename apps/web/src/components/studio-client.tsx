"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listMine, recordings } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextTabs } from "@/components/page-tabs";
import { StudioLive } from "@/components/studio-live";
import { StreamSetupCard } from "@/components/stream-setup-card";
import { MemberManager } from "@/components/member-manager";
import { RecordingCard } from "@/components/recording-card";

const SECTIONS = [
  { id: "live", label: "Live" },
  { id: "setup", label: "Setup" },
  { id: "members", label: "Members" },
  { id: "recordings", label: "Recordings" },
];

export function StudioClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: mine = [], isLoading } = useQuery({ queryKey: ["mine"], queryFn: listMine });

  const channelId = params.get("channel") ?? mine[0]?.id;
  const channel = mine.find((c) => c.id === channelId) ?? mine[0];
  const section = params.get("section") ?? "live";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", "studio");
    if (key === "channel") next.delete("section");
    next.set(key, value);
    router.replace(`/dashboard?${next.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (mine.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <p className="font-display text-xl font-bold tracking-tight text-foreground">
          No channels yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first channel from the home page — then manage streams, members, and
          recordings right here.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">
            Browse home
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {mine.length > 1 && (
        <TextTabs
          tabs={mine.map((c) => ({ id: c.id, label: c.name }))}
          active={channel.id}
          onChange={(id) => setParam("channel", id)}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {channel.name}
        </h2>
        <Link href={`/channel/${channel.slug}`}>
          <Button variant="outline" size="sm">
            View public page
          </Button>
        </Link>
      </div>

      <TextTabs tabs={SECTIONS} active={section} onChange={(id) => setParam("section", id)} />

      <div>
        {section === "live" && <StudioLive communityId={channel.id} />}
        {section === "setup" && <StreamSetupCard community={channel} />}
        {section === "members" && (
          <Card className="p-4">
            <MemberManager communityId={channel.id} />
          </Card>
        )}
        {section === "recordings" && <StudioRecordings channel={channel} />}
      </div>
    </div>
  );
}

function StudioRecordings({ channel }: { channel: { id: string; name: string; slug: string } }) {
  const { data: recs = [] } = useQuery({
    queryKey: ["recordings", channel.id],
    queryFn: () => recordings(channel.id),
  });
  if (recs.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Recordings show up here after your first stream ends.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {recs.map((r) => (
        <RecordingCard
          key={r.path}
          recording={{
            community_id: channel.id,
            name: r.name,
            path: r.path,
            size_bytes: r.size_bytes,
            created_at: r.created_at,
            community_name: channel.name,
            community_slug: channel.slug,
          }}
        />
      ))}
    </div>
  );
}
