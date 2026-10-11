"use client";

/**
 * A tall scroll track with a sticky stage. ScrollTrigger (loaded on demand through the motion layer) turns the scroll
 * position of the track into progress 0..1 in a store; the stage children read it. No pinning, so no pin spacers.
 * The trigger is killed when the component unmounts.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionEffect } from "@/motion/hooks";
import { activeStationIndex } from "./stations";
import { createProgressStore, type ProgressStore } from "./progress-store";

/** Scroll distance per chapter segment, in viewport heights: shorter on Tier B (BUILD_SPEC section 10). */
export const SEGMENT_VH = { A: 80, B: 55 } as const;
const STAGE_PADDING_VH = 100;

interface ScrollStageProps {
  stationCount: number;
  tier: "A" | "B";
  label: string;
  children: (state: { store: ProgressStore; activeIndex: number }) => ReactNode;
}

export function ScrollStage({ stationCount, tier, label, children }: ScrollStageProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [store] = useState(() => createProgressStore());
  const [activeIndex, setActiveIndex] = useState(0);
  const trackVh = (stationCount - 1) * SEGMENT_VH[tier] + STAGE_PADDING_VH;

  useMotionEffect(trackRef, true, `${tier}:${stationCount}`, ({ ScrollTrigger }, element) => {
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => store.set(self.progress),
      onRefresh: (self) => store.set(self.progress),
    });
    return () => trigger.kill();
  });

  useEffect(() => {
    const sync = (p: number) => setActiveIndex((current) => {
      const next = activeStationIndex(stationCount, p);
      return next === current ? current : next;
    });
    return store.subscribe(sync);
  }, [store, stationCount]);

  return (
    <div ref={trackRef} style={{ height: `${trackVh}svh` }} className="relative" data-diorama-track>
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-[#f3efe7]" role="group" aria-label={label}>
        {children({ store, activeIndex })}
      </div>
    </div>
  );
}
