"use client";

import { useRef } from "react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";

/**
 * A screenshot that drifts a few percent against its frame as the page scrolls, so the frame reads
 * as a window onto the app. The image is slightly oversized so the frame never shows an edge.
 */
export function ParallaxScreen({ src, alt }: { src: string; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  // Under reduced motion the range collapses, so the image sits still at its natural size.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-3%", "3%"]);

  return (
    <div ref={frame} className="overflow-hidden rounded-lg border border-border bg-card">
      <m.img
        src={src}
        alt={alt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        style={{ y, scale: reduce ? 1 : 1.06 }}
        className="block h-auto w-full"
      />
    </div>
  );
}
