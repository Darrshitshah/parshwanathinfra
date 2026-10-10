"use client";

import { useEffect, useState } from "react";
import { loadTownshipShape, type TownshipShape } from "./township";

/**
 * The shape to cut transitions from: the one passed in, else the plan loaded lazily once `wanted` is true.
 * Returns null until it is known, so callers fall back to the plain panel curtain.
 */
export function useTownshipShape(provided: TownshipShape | undefined, wanted: boolean): TownshipShape | null {
  const [loaded, setLoaded] = useState<TownshipShape | null>(null);

  useEffect(() => {
    if (provided || !wanted || loaded) return;
    let cancelled = false;
    // Idle: the shape is only needed from the first click, never for first paint.
    const start = () => {
      loadTownshipShape()
        .then((shape) => {
          if (!cancelled) setLoaded(shape);
        })
        .catch(() => undefined);
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(start, 1200) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [provided, wanted, loaded]);

  return provided ?? loaded;
}
