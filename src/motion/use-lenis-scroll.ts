"use client";

import { useEffect } from "react";
import { loadMotion } from "./load";
import { setLenis } from "./scroll";

/**
 * Lenis smooth wheel scrolling, synced to ScrollTrigger and driven by the GSAP ticker.
 * Runs only while `enabled` (Tier A, fine pointer, no reduced motion). Turning it off, a tier change and unmount all
 * destroy the instance, remove the ticker callback and restore GSAP's lag smoothing, so nothing keeps running.
 * Lenis and the GSAP runtime are imported on demand, so touch devices never download Lenis.
 */
export function useLenisScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import("lenis"), loadMotion()]);
      if (cancelled) return;

      // The GSAP ticker owns the frame loop, so Lenis must not start its own.
      const lenis = new Lenis({ autoRaf: false });
      const stopListening = lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);

      teardown = () => {
        setLenis(null);
        gsap.ticker.remove(tick);
        stopListening();
        lenis.destroy();
        gsap.ticker.lagSmoothing(500, 33);
      };
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [enabled]);
}
