"use client";

import { cn } from "@/lib/cn";

export interface UnderlineTab {
  id: string;
  label: string;
  count?: number;
}

/** Content tabs: quiet labels, the active one in full ink with a marigold underline. */
export function UnderlineTabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: UnderlineTab[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={on}
            aria-controls={`panel-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative px-3.5 py-2.5 text-sm font-medium outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 font-num text-xs text-muted-foreground">{t.count}</span>
            )}
            {on && (
              <span
                className="absolute inset-x-2.5 -bottom-px h-0.5 bg-primary"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
