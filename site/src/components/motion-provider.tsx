"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** One place that loads the animation features (lazily, a few KB) and honours reduced motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
