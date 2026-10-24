"use client";

import { useMemo } from "react";
import type { ChannelSort, ChannelStatus } from "@/lib/types";
import { useBrowseChannels } from "@/lib/use-browse";
import { useUrlParams } from "@/lib/use-url-params";
import { StreamCard } from "@/components/stream-card";
import { BrowseHeader } from "@/components/browse/browse-header";
import { CardGrid, CardSkeletons } from "@/components/browse/card-grid";
import { FilterBar, FilterSelect } from "@/components/browse/filter-bar";
import { ResultsMessage } from "@/components/browse/results-state";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

const STATUS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live now" },
  { value: "offline", label: "Offline" },
];
const SORT = [
  { value: "viewers", label: "Most viewers" },
  { value: "followers", label: "Most followers" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
];
const oneOf = <T extends string>(v: string, allowed: { value: string }[], fallback: T): T =>
  (allowed.some((a) => a.value === v) ? v : fallback) as T;

/**
 * Channels with search, status and sort, one page at a time. With `onlyLive` the status is fixed
 * and the page is the live directory.
 */
export function ChannelBrowser({ onlyLive = false }: { onlyLive?: boolean }) {
  const url = useUrlParams();
  const q = url.get("q");
  const status: ChannelStatus = onlyLive ? "live" : oneOf(url.get("status"), STATUS, "all");
  const sort: ChannelSort = oneOf(url.get("sort"), SORT, "viewers");

  const query = useMemo(
    () => ({ q, status, sort, page: url.page, page_size: PAGE_SIZE }),
    [q, status, sort, url.page],
  );
  const { data, isPending, isError, isFetching, refetch } = useBrowseChannels(query);

  const filtered = !!q || (!onlyLive && status !== "all") || sort !== "viewers";
  const clear = () => url.set({ q: null, status: null, sort: null });
  const total = data?.total ?? 0;

  return (
    <div className="px-4 py-6 sm:px-6">
      <BrowseHeader
        eyebrow={onlyLive ? "Live" : "Channels"}
        title={onlyLive ? "Live now" : "All channels"}
        summary={
          data && (
            <>
              <span className="font-num">{total}</span> {onlyLive ? "live" : "matching"} channel
              {total === 1 ? "" : "s"}
            </>
          )
        }
      />

      <FilterBar
        q={q}
        onQuery={(value) => url.set({ q: value })}
        placeholder="Filter by name, handle, about or stream title"
        onClear={clear}
        canClear={filtered}
      >
        {!onlyLive && (
          <FilterSelect
            label="Show"
            value={status}
            onChange={(v) => url.set({ status: v === "all" ? null : v })}
            options={STATUS}
          />
        )}
        <FilterSelect
          label="Sort by"
          value={sort}
          onChange={(v) => url.set({ sort: v === "viewers" ? null : v })}
          options={SORT}
        />
      </FilterBar>

      <div className="mt-6" aria-busy={isFetching}>
        {isPending ? (
          <CardSkeletons count={8} />
        ) : isError ? (
          <ResultsMessage kind="error" onRetry={() => void refetch()}>
            Could not load channels. Check that the server is running, then try again.
          </ResultsMessage>
        ) : data.items.length === 0 ? (
          <ResultsMessage kind="empty">
            {q
              ? `No channel matches “${q}”${filtered && (q ? status !== "all" : true) ? " with these filters" : ""}.`
              : onlyLive
                ? "Nobody is live right now."
                : "No channels here yet."}
          </ResultsMessage>
        ) : (
          <CardGrid key={`${q}|${status}|${sort}|${data.page}`}>
            {data.items.map((c) => (
              <StreamCard key={c.community_id} channel={c} />
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
