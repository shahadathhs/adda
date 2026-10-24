"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Notices a broadcast ending while the page is open: returns how long it ran
 * (null if unknown) once `isLive` flips from true to false, and clears if the
 * channel goes live again.
 */
export function useStreamEnded(
  isLive: boolean,
  startedAt: string | null,
): { seconds: number | null } | null {
  const wasLive = useRef(isLive);
  const start = useRef(startedAt);
  const [ended, setEnded] = useState<{ seconds: number | null } | null>(null);

  useEffect(() => {
    if (isLive) {
      wasLive.current = true;
      if (startedAt) start.current = startedAt;
      const clear = setTimeout(() => setEnded(null), 0);
      return () => clearTimeout(clear);
    }
    if (!wasLive.current) return;
    wasLive.current = false;
    const seconds = start.current
      ? Math.round((Date.now() - new Date(start.current).getTime()) / 1000)
      : null;
    const show = setTimeout(() => setEnded({ seconds }), 0);
    return () => clearTimeout(show);
  }, [isLive, startedAt]);

  return ended;
}
