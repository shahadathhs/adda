"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Radio } from "lucide-react";
import { discoverChannels, listMine, stopStream } from "@adda/api-client";
import type { DiscoverChannel } from "@adda/types";
import { webKeys } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveBadge, UserAvatar } from "@/components/ui/primitives";
import { MembersPanel } from "@/components/member-manager";
import { toast } from "sonner";

export function StudioClient() {
  const qc = useQueryClient();
  const { data: mine = [] } = useQuery({ queryKey: ["mine"], queryFn: listMine });
  const { data: discover = [] } = useQuery({
    queryKey: webKeys.discover(),
    queryFn: () => discoverChannels(),
    refetchInterval: 15_000,
  });

  const liveById = new Map<string, DiscoverChannel>(discover.map((d) => [d.community_id, d]));

  const stop = useMutation({
    mutationFn: (id: string) => stopStream(id),
    onSuccess: () => {
      toast.success("Stream stopped");
      qc.invalidateQueries({ queryKey: webKeys.discover() });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not stop the stream"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          Your channels
        </h2>
        <Link href="/">
          <Button variant="outline" size="sm">
            Browse
          </Button>
        </Link>
      </div>

      {mine.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have a channel yet — create one from{" "}
            <Link href="/" className="text-primary hover:underline">
              Browse
            </Link>
            .
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {mine.map((c) => {
          const live = liveById.get(c.id);
          const isLive = live?.is_live ?? false;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <UserAvatar name={c.name} src={c.avatar_url} className="h-12 w-12 text-base" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-foreground">
                      {c.name}
                    </h2>
                    {isLive ? <LiveBadge /> : null}
                    {isLive && (live?.viewers ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-num">{live?.viewers}</span> watching
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {c.stream_title || c.description || `@${c.slug}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={stop.isPending}
                      onClick={() => stop.mutate(c.id)}
                    >
                      <Radio className="h-4 w-4" aria-hidden="true" />
                      Stop stream
                    </Button>
                  )}
                  <MembersPanel communityId={c.id} />
                  <Link href={`/channel/${c.slug}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
              {!isLive && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Go live from the channel page — stream setup has your OBS URL and key.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
