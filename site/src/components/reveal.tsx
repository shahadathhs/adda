"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";

/**
 * Rises 12px and fades in once as it scrolls into view. Siblings pass an increasing `delay` (35 ms
 * apart) to arrive in turn. Under reduced motion it only fades; without JavaScript the layout
 * stylesheet in `layout.tsx` shows it at once.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Milliseconds to wait after entering view. */
  delay?: number;
}) {
  return (
    <m.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ type: "spring", stiffness: 260, damping: 30, delay: delay / 1000 }}
    >
      {children}
    </m.div>
  );
}
