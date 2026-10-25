"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useBrowseChannels, useDebounced, useGlobalSearch } from "@/lib/use-browse";
import { searchHits, type SearchHit } from "@/lib/search-hits";
import { SearchOption } from "@/components/search/search-option";
import { cn } from "@/lib/cn";

/**
 * The one search box: channels, live streams and recordings, with suggestions as you type.
 * Arrow keys move through the list, Enter opens the highlighted row (or every result), Escape closes.
 */
export function GlobalSearch({
  size = "bar",
  className,
}: {
  size?: "bar" | "hero";
  className?: string;
}) {
  const router = useRouter();
  const urlQ = useSearchParams().get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  const q = useDebounced(value.trim(), 180);
  const typing = value.trim().length > 0;
  const search = useGlobalSearch(q);
  const live = useBrowseChannels(
    { status: "live", sort: "viewers", page_size: 5 },
    open && !typing,
  );

  // Follow the address when it changes (a link, back/forward), without an effect.
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (seenUrlQ !== urlQ) {
    setSeenUrlQ(urlQ);
    setValue(urlQ);
  }
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const result = typing ? search.data : undefined;
  const found = typing ? searchHits(value, result) : [];
  const hits: SearchHit[] = typing
    ? found.filter((h) => h.kind !== "all" || found.length > 1)
    : (live.data?.items ?? []).map((channel) => ({
        kind: "channel" as const,
        channel,
        href: `/channel/${channel.slug}`,
      }));
  const settled = !typing || (search.data && search.data.query === value.trim());
  const nothing =
    typing &&
    settled &&
    !result?.channels.length &&
    !result?.recordings.length &&
    !result?.videos.length;
  const optionId = (i: number) => `${listId}-${i}`;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const submit = () => {
    const hit = active >= 0 ? hits[active] : undefined;
    if (hit) return go(hit.href);
    go(typing ? `/search?q=${encodeURIComponent(value.trim())}` : "/search");
  };

  const hero = size === "hero";
  const showList = open && (typing || hits.length > 0);

  return (
    <div ref={box} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            hero ? "left-4 h-5 w-5" : "left-3 h-4 w-4",
          )}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={value}
          placeholder={hero ? "Search channels and recordings…" : "Search adda…"}
          aria-label="Search channels, live streams and recordings"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              if (!hits.length) return;
              const last = hits.length - 1;
              setActive((i) =>
                e.key === "ArrowDown" ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1,
              );
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
          className={cn(
            "w-full rounded-md border border-input bg-input/50 pr-10 text-foreground placeholder:text-muted-foreground transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-search-cancel-button]:hidden",
            hero ? "h-12 pl-12 text-base" : "h-9 pl-9 text-sm",
          )}
        />
        {typing && search.isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </form>

      {showList && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border border-border bg-popover p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {!typing && (
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Live now
            </p>
          )}
          <div id={listId} role="listbox" aria-label="Suggestions">
            {hits.map((hit, i) => (
              <SearchOption
                key={hit.href}
                hit={hit}
                q={value.trim()}
                id={optionId(i)}
                active={i === active}
                onPick={() => setOpen(false)}
                onHover={() => setActive(i)}
              />
            ))}
          </div>
          {typing && !settled && !hits.length && (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">Searching…</p>
          )}
          {nothing && (
            <p className="px-2.5 pb-1 pt-2 text-sm text-muted-foreground">
              No channel or recording matches “{value.trim()}”.
            </p>
          )}
          {typing && search.isError && (
            <p role="alert" className="px-2.5 py-3 text-sm text-destructive">
              Search is unavailable right now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
