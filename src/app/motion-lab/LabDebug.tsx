"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { getLenis } from "@/motion";

interface MotionDebug {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  getLenis: typeof getLenis;
  /** Live counters for the cleanup checks (scroll triggers, ticker callbacks, running tweens). */
  counts: () => { scrollTriggers: number; tickerListeners: number; activeTweens: number; lenis: boolean };
}

declare global {
  interface Window {
    __motion?: MotionDebug;
  }
}

/** Exposes GSAP and counters on `window.__motion` so the team can check cleanup from the console or a test. Lab only. */
export function LabDebug() {
  useEffect(() => {
    window.__motion = {
      gsap,
      ScrollTrigger,
      getLenis,
      counts: () => ({
        scrollTriggers: ScrollTrigger.getAll().length,
        tickerListeners: (gsap.ticker as unknown as { _listeners: unknown[] })._listeners.length,
        activeTweens: gsap.globalTimeline.getChildren(true, true, false).filter((child) => child.isActive()).length,
        lenis: getLenis() !== null,
      }),
    };
    // Left in place on unmount on purpose: checks run after navigating away from the lab.
  }, []);
  return null;
}
