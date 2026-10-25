"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounced } from "@/lib/use-browse";

const select =
  "h-9 rounded-sm border border-input bg-input/50 px-2.5 text-sm text-foreground outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring";

/** A labelled native select that fits the filter bar. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The text filter, kept in the address after a pause, plus the controls passed in as children. */
export function FilterBar({
  q,
  onQuery,
  placeholder,
  onClear,
  canClear,
  children,
}: {
  q: string;
  onQuery: (q: string) => void;
  placeholder: string;
  onClear: () => void;
  canClear: boolean;
  children?: ReactNode;
}) {
  const [text, setText] = useState(q);
  const settled = useDebounced(text.trim(), 300);

  const [seenQ, setSeenQ] = useState(q);
  if (seenQ !== q) {
    setSeenQ(q);
    setText(q);
  }
  useEffect(() => {
    if (settled !== q) onQuery(settled);
    // Only a change of the typed text should push; `q` and `onQuery` are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-border bg-card p-3"
    >
      <div className="relative min-w-[220px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-sm border border-input bg-input/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring"
        />
      </div>
      {children}
      {canClear && (
        <Button type="button" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4" aria-hidden="true" />
          Clear filters
        </Button>
      )}
    </form>
  );
}
