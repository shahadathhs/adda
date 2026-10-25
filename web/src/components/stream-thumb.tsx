"use client";

import { useEffect, useRef, useState } from "react";
import { thumbUrl } from "@/lib/data";
import { cn } from "@/lib/cn";

/** The last captured frame of a channel; a monogram panel when there is none. */
export function StreamThumb({
  communityId,
  name,
  className,
}: {
  communityId: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // An image that failed before hydration never fires onError; catch it here.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-card", className)}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
          <span className="font-display text-4xl font-bold text-muted-foreground/25">
            {name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={thumbUrl(communityId)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-[filter] duration-120 group-hover:brightness-105"
        />
      )}
    </div>
  );
}
