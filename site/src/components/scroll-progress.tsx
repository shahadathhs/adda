"use client";

import { useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";

/** A thin marigold bar under the header that fills as you scroll down any page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <m.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-14 z-30 h-0.5 origin-left bg-primary"
    />
  );
}
