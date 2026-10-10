"use client";

/**
 * Scroll-triggered React hooks for the motion primitives. Owner: motion-lead.
 *
 * Every hook:
 *  - runs only when the device tier is ready and is not Tier C (Tier C, which includes reduced motion, keeps the
 *    static server-rendered content exactly as it is);
 *  - plays once, when the element's top edge reaches `start` (default "top 85%"), then removes its own trigger;
 *  - is cleaned up on unmount, on route change and when its options change: every tween, ScrollTrigger and SplitText
 *    it created is reverted;
 *  - never touches layout: transform, opacity, SVG stroke and clip-path only.
 *
 * Pass a ref to the element to animate. Content must be readable without these hooks (they only enhance it).
 *
 * This file is the THIN layer: it never imports GSAP. The GSAP code (effects.ts and the primitives) loads in its own
 * chunk through `loadMotion()` right after hydration, so it stays out of the initial JavaScript (see load.ts).
 * For your own GSAP code use `useMotionEffect`; do not import `gsap` in a component.
 */
import { useLayoutEffect, useRef, type RefObject } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import type { Tier } from "@/lib/device-tier";
import type {
  BoulevardWipeHookOptions,
  DimensionCountHookOptions,
  FadeRevealHookOptions,
  InkDrawHookOptions,
  RevealHookOptions,
  SplitRevealHookOptions,
  StripBlindsHookOptions,
} from "./hook-types";
import { getMotion, loadMotion, type MotionRuntime } from "./load";

export type {
  BoulevardWipeHookOptions,
  DimensionCountHookOptions,
  FadeRevealHookOptions,
  InkDrawHookOptions,
  RevealHookOptions,
  SplitRevealHookOptions,
  StripBlindsHookOptions,
};

export interface MotionGate {
  /** True once the tier is known and it is A or B: scroll-triggered enhancements may run. */
  enabled: boolean;
  /** True on Tier A only: parallax and other motion that needs a capable device. */
  rich: boolean;
  tier: Tier;
  ready: boolean;
  reducedMotion: boolean;
}

/** The single place that decides whether motion runs. Use it in your own hooks and components. */
export function useMotionGate(): MotionGate {
  const { tier, ready, reducedMotion } = useDeviceTier();
  const enabled = ready && tier !== "C" && !reducedMotion;
  return { enabled, rich: enabled && tier === "A", tier, ready, reducedMotion };
}

/**
 * Run your own GSAP code on an element without importing GSAP into a component.
 *
 *   useMotionEffect(ref, enabled, "key", ({ gsap }, element) => {
 *     const tween = gsap.to(element, { x: 20 });
 *     return () => tween.kill();                 // optional cleanup
 *   });
 *
 * `run` is called once the runtime has loaded (synchronously, before paint, when it already has) and again whenever
 * `key` changes. Put every value that should restart the effect into `key` as a string. The cleanup you return runs on
 * unmount and before each re-run. Nothing runs while `enabled` is false.
 */
export function useMotionEffect<T extends Element>(
  ref: RefObject<T | null>,
  enabled: boolean,
  key: string,
  run: (runtime: MotionRuntime, element: T) => void | (() => void),
): void {
  const latest = useRef(run);
  // Declared before the effect below, so on a re-run it already holds this render's closure.
  useLayoutEffect(() => {
    latest.current = run;
  });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    let cancelled = false;
    let cleanup: void | (() => void);
    const start = (runtime: MotionRuntime) => {
      if (!cancelled) cleanup = latest.current(runtime, element);
    };
    const loaded = getMotion();
    if (loaded) start(loaded);
    else loadMotion().then(start, () => undefined);
    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
    };
  }, [enabled, ref, key]);
}

/* ------------------------------------------------------------------------------------------------ */

/**
 * Lines, words or characters rise out of a mask when the text scrolls into view.
 * `ref` points at the text element (a heading or paragraph). The original markup is restored when it finishes.
 */
export function useSplitReveal<T extends HTMLElement>(ref: RefObject<T | null>, options: SplitRevealHookOptions = {}): void {
  const { enabled } = useMotionGate();
  const { by = "lines", start, stagger, duration, delay } = options;
  useMotionEffect(ref, enabled, [by, start, stagger, duration, delay].join("|"), (runtime, element) =>
    runtime.effects.revealSplit(element, { by, start, stagger, duration, delay }),
  );
}

/**
 * SVG strokes draw like ink when the drawing scrolls into view.
 * `ref` points at an <svg>, a <g>, or a wrapper that contains stroked shapes. Mark shapes to skip with `data-ink-skip`.
 */
export function useInkDraw<T extends Element>(ref: RefObject<T | null>, options: InkDrawHookOptions = {}): void {
  const { enabled } = useMotionGate();
  const { start, stagger, duration, delay } = options;
  useMotionEffect(ref, enabled, [start, stagger, duration, delay].join("|"), (runtime, element) =>
    runtime.effects.revealInk(element, { start, stagger, duration, delay }),
  );
}

/**
 * A dimension line draws and its number counts up when the stat scrolls into view.
 * `ref` points at a wrapper containing (all optional except the output):
 *   [data-dim-line]    the SVG line to draw
 *   [data-dim-tick]    end ticks (SVG lines), first and last
 *   [data-dim-output]  the element whose text becomes the number (server-render the final value in it)
 * Indian grouping by default (1,565 and 12,50,000). The final text is restored if the component unmounts mid-count.
 * Digits should be tabular and the markup should reserve the final width (see <DimensionStat>), so nothing shifts
 * while counting. `format` is read when the effect starts; changing it alone does not restart the count.
 */
export function useDimensionCount<T extends HTMLElement>(
  ref: RefObject<T | null>,
  value: number,
  options: DimensionCountHookOptions = {},
): void {
  const { enabled } = useMotionGate();
  const { start, duration, delay, format, decimals = 0 } = options;
  useMotionEffect(ref, enabled, [value, start, duration, delay, decimals].join("|"), (runtime, element) =>
    runtime.effects.revealDimension(element, value, { start, duration, delay, format, decimals }),
  );
}

/**
 * Row-house "blinds" reveal for a picture or a gallery.
 * `ref` points at a wrapper. Children marked `data-blinds-item` each get their own reveal as they scroll in (items
 * entering together are staggered); without markers the wrapper itself is revealed. Items must be block-level
 * boxes with a size (an image frame, a figure), not inline elements.
 */
export function useStripBlinds<T extends HTMLElement>(ref: RefObject<T | null>, options: StripBlindsHookOptions = {}): void {
  const { enabled, tier } = useMotionGate();
  const { start, duration, delay, orientation = "vertical" } = options;
  const strips = options.strips ?? (tier === "A" ? 12 : 6);
  useMotionEffect(ref, enabled, [strips, orientation, start, duration, delay].join("|"), (runtime, element) =>
    runtime.effects.revealBlinds(element, strips, { start, duration, delay, orientation }),
  );
}

/**
 * The 40' boulevard: a line draws across the section break, optionally uncovering content behind it.
 * `ref` points at the line itself (a 1px rule) or at a wrapper with [data-wipe-line] / [data-wipe-content] children.
 */
export function useBoulevardWipe<T extends HTMLElement>(ref: RefObject<T | null>, options: BoulevardWipeHookOptions = {}): void {
  const { enabled } = useMotionGate();
  const { start, duration, delay, direction = "ltr", mode } = options;
  useMotionEffect(ref, enabled, [direction, mode, start, duration, delay].join("|"), (runtime, element) =>
    runtime.effects.revealWipe(element, { start, duration, delay, direction, mode }),
  );
}

/** A soft fade-and-rise when the element scrolls into view. The simplest reveal; use it for cards and blocks. */
export function useFadeReveal<T extends HTMLElement>(ref: RefObject<T | null>, options: FadeRevealHookOptions = {}): void {
  const { enabled } = useMotionGate();
  const { start, duration, delay, y } = options;
  useMotionEffect(ref, enabled, [start, duration, delay, y].join("|"), (runtime, element) =>
    runtime.effects.revealFade(element, { start, duration, delay, y }),
  );
}

/**
 * Scroll parallax inside a frame (Tier A only; nothing runs on Tier B or C, so the image simply sits still).
 * `ref` points at the moving element, usually an <img> filling a frame. Its parent is the frame: it must have
 * `overflow: hidden`, and its position in the viewport drives the movement.
 * `amount` is how far it travels each way, as a percentage of its own height (default 8). The hook scales the
 * element up just enough that its edges never show.
 */
export function useParallax<T extends HTMLElement>(ref: RefObject<T | null>, amount = 8): void {
  const { rich } = useMotionGate();
  useMotionEffect(ref, rich, String(amount), (runtime, element) => runtime.effects.driftParallax(element, amount));
}
