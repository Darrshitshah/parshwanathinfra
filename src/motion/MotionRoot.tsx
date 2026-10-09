"use client";

/**
 * Global motion layer mounted once by src/app/layout.tsx (Director).
 * Owner: motion-lead. Placeholder until Phase 1: it will register GSAP, run Lenis (Tier A, fine pointer),
 * provide page transitions and mount the S8 cursor. Keep the export name and props.
 */
import type { ReactNode } from "react";

export function MotionRoot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
