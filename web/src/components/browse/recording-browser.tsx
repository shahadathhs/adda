"use client";

import { useMemo } from "react";
import type { RecordingSort } from "@/lib/types";
import { useBrowseChannels, useBrowseRecordings } from "@/lib/use-browse";
import { useUrlParams } from "@/lib/use-url-params";
import { RecordingCard } from "@/components/recording-card";
import { BrowseHeader } from "@/components/browse/browse-header";
import { CardGrid, CardSkeletons } from "@/components/browse/card-grid";
import { FilterBar, FilterSelect } from "@/components/browse/filter-bar";
import { ResultsMessage } from "@/components/browse/results-state";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

const SORT = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "largest", label: "Largest file" },
];

/** Recordings with search, channel and sort, one page at a time. */
export function RecordingBrowser() {
  const url = useUrlParams();
  const q = url.get("q");
  const channel = url.get("channel");
  const sort: RecordingSort = SORT.some((s) => s.value === url.get("sort"))
    ? (url.get("sort") as RecordingSort)
    : "newest";

  const query = useMemo(
    () => ({ q, channel, sort, page: url.page, page_size: PAGE_SIZE }),
    [q, channel, sort, url.page],
  );
  const { data, isPending, isError, isFetching, refetch } = useBrowseRecordings(query);
  const channels = useBrowseChannels({ sort: "name", page_size: 48 });

  const filtered = !!q || !!channel || sort !== "newest";
  const total = data?.total ?? 0;
  const channelOptions = [
    { value: "", label: "All channels" },
    ...(channels.data?.items ?? []).map((c) => ({ value: c.slug, label: c.name })),
  ];
  if (channel && !channelOptions.some((o) => o.value === channel))
    channelOptions.push({ value: channel, label: channel });

  return (
    <div className="px-4 py-6 sm:px-6">
      <BrowseHeader
        eyebrow="Recordings"
        title="Every broadcast"
        summary={
          data && (
            <>
              <span className="font-num">{total}</span> recording{total === 1 ? "" : "s"}
            </>
          )
        }
      />

      <FilterBar
        q={q}
        onQuery={(value) => url.set({ q: value })}
        placeholder="Filter by title or channel"
        onClear={() => url.set({ q: null, channel: null, sort: null })}
        canClear={filtered}
      >
        <FilterSelect
          label="Channel"
          value={channel}
          onChange={(v) => url.set({ channel: v || null })}
          options={channelOptions}
        />
        <FilterSelect
          label="Sort by"
          value={sort}
          onChange={(v) => url.set({ sort: v === "newest" ? null : v })}
          options={SORT}
        />
      </FilterBar>

      <div className="mt-6" aria-busy={isFetching}>
        {isPending ? (
          <CardSkeletons count={8} />
        ) : isError ? (
          <ResultsMessage kind="error" onRetry={() => void refetch()}>
            Could not load recordings. Check that the server is running, then try again.
          </ResultsMessage>
        ) : data.items.length === 0 ? (
          <ResultsMessage kind="empty">
            {filtered
              ? "No recording matches these filters."
              : "Recordings appear here after a broadcast ends."}
          </ResultsMessage>
        ) : (
          <CardGrid key={`${q}|${channel}|${sort}|${data.page}`}>
            {data.items.map((r) => (
              <RecordingCard key={r.path} recording={r} />
            ))}
          </CardGrid>
        )}
      </div>

      {data && (
        <Pagination
          page={data.page}
          pageSize={data.page_size}
          total={data.total}
          href={(p) => url.hrefFor({ page: p === 1 ? null : p })}
        />
      )}
    </div>
  );
}
