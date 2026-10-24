"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGlobalSearch } from "@/lib/use-browse";
import { useUrlParams } from "@/lib/use-url-params";
import { RecordingCard } from "@/components/recording-card";
import { StreamCard } from "@/components/stream-card";
import { BrowseHeader } from "@/components/browse/browse-header";
import { CardGrid, CardSkeletons } from "@/components/browse/card-grid";
import { ResultsMessage } from "@/components/browse/results-state";
import { GlobalSearch } from "@/components/search/global-search";
import { buttonClass } from "@/components/ui/button-styles";

const SHOWN = 8;

/** Everything that matches (`query` overrides the address, for design previews) a search: channels and recordings, each with a link to its full directory. */
export function SearchPage({ query }: { query?: string }) {
  const fromUrl = useUrlParams().get("q");
  const q = (query ?? fromUrl).trim();
  const { data, isPending, isError, refetch } = useGlobalSearch(q, SHOWN);

  const group = (title: string, count: number, all: string, children: React.ReactNode[]) => (
    <section className="mt-8" aria-label={title}>
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
          <span className="ml-2 font-num text-sm font-medium text-muted-foreground">{count}</span>
        </h2>
        <Link
          href={all}
          className="inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-primary outline-none hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Filter and page through all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <CardGrid>{children}</CardGrid>
    </section>
  );

  const nothing = data && !data.channels.length && !data.recordings.length;
  const enc = encodeURIComponent(q);

  return (
    <div className="px-4 py-6 sm:px-6">
      <BrowseHeader
        eyebrow="Search"
        title={q ? `Results for “${q}”` : "Search adda"}
        summary="Channels, live streams and recordings."
      />
      <GlobalSearch className="mt-5 max-w-[640px]" />

      {!q ? (
        <ResultsMessage
          kind="empty"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/live" className={buttonClass("outline")}>
                Live now
              </Link>
              <Link href="/channels" className={buttonClass("outline")}>
                All channels
              </Link>
              <Link href="/recordings" className={buttonClass("outline")}>
                Recordings
              </Link>
            </div>
          }
        >
          Type a name, a stream title or a recording to search everything on this server.
        </ResultsMessage>
      ) : isPending ? (
        <div className="mt-8">
          <CardSkeletons count={4} />
        </div>
      ) : isError ? (
        <ResultsMessage kind="error" onRetry={() => void refetch()}>
          Search is unavailable right now. Try again in a moment.
        </ResultsMessage>
      ) : nothing ? (
        <ResultsMessage kind="empty">
          Nothing matches “{q}”. Check the spelling, or browse the directories instead.
        </ResultsMessage>
      ) : (
        <>
          {data.channels.length > 0 &&
            group(
              "Channels",
              data.channels.length,
              `/channels?q=${enc}`,
              data.channels.map((c) => <StreamCard key={c.community_id} channel={c} />),
            )}
          {data.recordings.length > 0 &&
            group(
              "Recordings",
              data.recordings.length,
              `/recordings?q=${enc}`,
              data.recordings.map((r) => <RecordingCard key={r.path} recording={r} />),
            )}
        </>
      )}
    </div>
  );
}
