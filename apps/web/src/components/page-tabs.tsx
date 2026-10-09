"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string; // when set, the tab is a link (cross-route dashboards)
}

/**
 * Primary pill tab bar — the dashboard's main navigation (reference:
 * Simfree dashboards). One dashboard surface, tabs across the top.
 */
export function PillTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-card p-1.5"
    >
      {tabs.map((t) => {
        const activeCls =
          t.id === active
            ? "bg-primary-subtle font-semibold text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground";
        const cls = cn(
          "flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xs px-3.5 py-2 text-sm outline-none",
          "transition-colors duration-120 ease-[var(--ease-micro)] focus-visible:outline-2 focus-visible:outline-ring",
          activeCls,
        );
        return t.href ? (
          <Link key={t.id} role="tab" aria-selected={t.id === active} href={t.href} className={cls}>
            {t.icon}
            {t.label}
          </Link>
        ) : (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            className={cls}
            onClick={() => onChange?.(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Secondary text tabs (reference: CURRENT / EXPIRED / ARCHIVED) — bold
 * text with the active item full-strength, for switching inside a section.
 */
export function TextTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "cursor-pointer pb-1 text-lg font-bold uppercase tracking-tight outline-none transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
            active === t.id
              ? "border-b-2 border-foreground text-foreground"
              : "border-b-2 border-transparent text-muted-foreground/50 hover:text-muted-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
