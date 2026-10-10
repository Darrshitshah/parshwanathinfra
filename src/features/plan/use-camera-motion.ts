"use client";

/**
 * Camera moves that are not scroll driven (chapter chips, "go to plot", a hotspot, the zoom buttons). With motion
 * allowed the camera glides (GSAP through the thin motion layer, loaded on demand); otherwise it jumps.
 * A new move, or any pointer gesture, kills the one in flight.
 */
import { useCallback, useEffect, useRef } from "react";
import { getMotion, loadMotion, type MotionRuntime } from "@/motion/load";
import { interpCam, type Cam } from "./camera";
import type { CameraStore } from "./camera-store";

export interface CameraMotion {
  /** Move to `target` over `duration` seconds (instant when motion is not allowed). */
  flyTo: (target: Cam, duration?: number) => void;
  /** Stop a move in flight. */
  stop: () => void;
}

export function useCameraMotion(store: CameraStore, animate: boolean): CameraMotion {
  const active = useRef<{ kill: () => void } | null>(null);

  const stop = useCallback(() => {
    active.current?.kill();
    active.current = null;
  }, []);

  const flyTo = useCallback(
    (target: Cam, duration = 1.1) => {
      stop();
      if (!animate) {
        store.set(target);
        return;
      }
      const from = store.get();
      let cancelled = false;
      const run = ({ gsap }: MotionRuntime) => {
        if (cancelled) return;
        const progress = { t: 0 };
        const tween = gsap.to(progress, {
          t: 1,
          duration,
          ease: "power3.inOut",
          onUpdate: () => store.set(interpCam(from, target, progress.t)),
          onComplete: () => {
            active.current = null;
          },
        });
        active.current = {
          kill: () => {
            cancelled = true;
            tween.kill();
          },
        };
      };
      active.current = {
        kill: () => {
          cancelled = true;
        },
      };
      const loaded = getMotion();
      if (loaded) run(loaded);
      else loadMotion().then(run, () => store.set(target));
    },
    [animate, store, stop],
  );

  useEffect(() => stop, [stop]);

  return { flyTo, stop };
}
