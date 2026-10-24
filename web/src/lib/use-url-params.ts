"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Filters that live in the address: read them, change some, and the page number resets. */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      const s = next.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [params, pathname],
  );

  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) =>
      router.replace(hrefFor({ page: null, ...patch }), { scroll: false }),
    [router, hrefFor],
  );

  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  return { get: (k: string) => params.get(k) ?? "", page, set, hrefFor, hasAny: params.size > 0 };
}
