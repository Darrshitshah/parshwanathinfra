"use client";

/**
 * Global motion layer mounted once by src/app/layout.tsx (Director). Owner: motion-lead.
 *
 * - runs Lenis smooth scrolling on Tier A with a fine pointer (never with reduced motion), synced to ScrollTrigger;
 * - provides the page transition (boundary curtain);
 * - mounts the S8 cursor on a fine pointer, off Tier C, once the tier is known (its code loads on demand).
 * GSAP itself is NOT imported here: the runtime loads in its own chunk after hydration (see load.ts), which keeps about
 * 50 KB gzipped out of the initial JavaScript.
 *
 * Keep the export name and `children` prop. `shape` is optional: when layout.tsx (a server component) passes
 * `shapeFromPlan(plan)` the curtain is cut from the township boundary from the first click, and the plan never
 * has to load on the client. Without it the plan loads lazily at idle and the panel curtain is used until then.
 */
import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { TransitionProvider } from "@/components/transition";
import { useDeviceTier } from "@/lib/device-tier-provider";
import "./motion.css";
import type { TownshipShape } from "./township";
import { useLenisScroll } from "./use-lenis-scroll";

// Touch and Tier C visitors never download the cursor.
const Cursor = dynamic(() => import("@/components/cursor/Cursor").then((module) => module.Cursor), { ssr: false });

export interface MotionRootProps {
  children: ReactNode;
  shape?: TownshipShape;
}

export function MotionRoot({ children, shape }: MotionRootProps) {
  const { ready, tier, finePointer, smoothScroll } = useDeviceTier();

  // Tier C never loads the runtime, so release anything CSS was holding back for it (`<Reveal pre>`).
  useEffect(() => {
    if (!ready || tier !== "C") return;
    const html = document.documentElement;
    html.dataset.motion = "off";
    return () => {
      delete html.dataset.motion;
    };
  }, [ready, tier]);

  useLenisScroll(ready && smoothScroll);

  return (
    <>
      <TransitionProvider shape={shape}>{children}</TransitionProvider>
      {ready && finePointer && tier !== "C" ? <Cursor /> : null}
    </>
  );
}
