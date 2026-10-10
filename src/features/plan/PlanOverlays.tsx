"use client";

/**
 * Drawing-sheet furniture on the stage: a north arrow (from the plan's bearing) and an indicative scale bar (from
 * the plan's metres per grid unit). Both update straight from the camera store.
 */
import { useEffect, useRef } from "react";
import { plan } from "@/content/plan";
import type { CameraStore } from "./camera-store";

const SCALE_STEPS_M = [5, 10, 20, 50, 100, 200, 500];
const SCALE_MAX_PX = 150;

/** The longest round length whose bar fits the space, in metres (null when even the shortest does not). */
export function scaleLength(pxPerMetre: number): number {
  let best = SCALE_STEPS_M[0];
  for (const step of SCALE_STEPS_M) {
    if (step * pxPerMetre <= SCALE_MAX_PX) best = step;
  }
  return best;
}

export function PlanOverlays({ store }: { store: CameraStore }) {
  const barRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => {
      const bar = barRef.current;
      const label = labelRef.current;
      if (!bar || !label) return;
      const pxPerMetre = store.get().s / plan.metresPerPx;
      const metres = scaleLength(pxPerMetre);
      bar.style.width = `${(metres * pxPerMetre).toFixed(1)}px`;
      const text = `${metres} m`;
      if (label.textContent !== text) label.textContent = text;
    };
    update();
    return store.subscribe(update);
  }, [store]);

  return (
    <div className="lp-overlays" aria-hidden="true">
      <div className="lp-north" style={{ transform: `rotate(${-plan.northDeg}deg)` }} />
      <span className="lp-north__n">N</span>
      <div className="lp-scale">
        <span ref={barRef} className="lp-scale__bar" />
        <span ref={labelRef} className="lp-scale__label" />
        <span className="lp-scale__note">indicative</span>
      </div>
    </div>
  );
}
