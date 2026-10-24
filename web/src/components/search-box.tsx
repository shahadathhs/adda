"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Header search; submits to the home grid, which filters by `?q=`. */
export function SearchBox() {
  const router = useRouter();
  const q = useSearchParams().get("q") ?? "";

  return (
    <form
      role="search"
      className="relative mx-auto hidden w-full max-w-[440px] sm:block"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        name="q"
        key={q}
        defaultValue={q}
        placeholder="Search channels…"
        aria-label="Search channels"
        className="h-9 w-full rounded-md border border-input bg-input/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring"
      />
    </form>
  );
}
