"use client";

/**
 * The mount point for the Living Plan. Renders the static fallback (`children`) until the slot is near the viewport,
 * then loads the plan code on demand (a dynamic import: it is in no route's initial JavaScript) and swaps it in.
 *
 *   <section id="plan" data-slot="living-plan">
 *     <LivingPlanSlot mode="story"><StaticPlanFigure /></LivingPlanSlot>
 *   </section>
 */
import { lazy, Suspense, type ReactNode } from "react";
import { useNearViewport } from "./use-near-viewport";

const LivingPlan = lazy(() => import("./LivingPlan").then((module) => ({ default: module.LivingPlan })));

interface LivingPlanSlotProps {
  mode?: "story" | "explore";
  /** The static fallback: shown on the server, without JavaScript, and while the plan loads. */
  children?: ReactNode;
  /** How early to start loading, as an IntersectionObserver rootMargin. */
  rootMargin?: string;
}

export function LivingPlanSlot({ mode = "story", children, rootMargin = "900px 0px" }: LivingPlanSlotProps) {
  const [hostRef, load] = useNearViewport<HTMLDivElement>(rootMargin);
  return (
    <div ref={hostRef} className="lp-slot" data-loaded={load ? "true" : "false"}>
      {load ? (
        <Suspense fallback={children}>
          <LivingPlan mode={mode} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
