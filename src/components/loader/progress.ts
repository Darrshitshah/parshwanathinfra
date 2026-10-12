/**
 * Timing for the S1 brand intro. Owner: motion-lead.
 *
 * The intro is short and does not wait for assets: the hero image paints underneath from the first frame, and the
 * overlay is gone about one second after JavaScript takes over. The maths here is pure (and tested); the DOM layer
 * lives in BoundaryLoader.tsx.
 */

/** Seconds, on the timeline. Everything is laid out against `draw` so the whole thing stays near one second. */
export const LOADER_TIMING = {
  /** The red boundary draws over this long. */
  draw: 0.5,
  /** The paper inside the outline starts to fade here, so the page shows through the township-shaped window. */
  plugAt: 0.4,
  plugFade: 0.18,
  /** The window grows to full bleed. */
  holeAt: 0.45,
  hole: 0.5,
  /** The leftover outline and dot fade while the window is opening. */
  accentsAt: 0.6,
  accentsFade: 0.2,
  /** The overlay layer itself fades at the very end (it is already see-through; this removes the last edge). */
  rootFadeAt: 0.95,
  rootFade: 0.08,
  /** Tier C and any fallback: a plain fade of the whole overlay. */
  fallbackFade: 0.2,
  /** If JavaScript has not taken over by now, CSS fades the loader by itself (see loader.css). */
  failsafeMs: 1500,
} as const;

/** The longest the animated loader lasts, in seconds, from the moment its timeline starts. */
export function worstCaseSeconds(timing: typeof LOADER_TIMING = LOADER_TIMING): number {
  return timing.rootFadeAt + timing.rootFade;
}

/** The loader must be gone this many seconds after JavaScript takes over. */
export const LOADER_BUDGET_SECONDS = 1.2;
/** Beyond this speed-up the drawing would look frantic, so only the plain fade plays. */
const MAX_SPEEDUP = 2.2;
/** If the motion runtime has not arrived by then, the loader leaves with a plain CSS fade rather than hold the page. */
export const RUNTIME_WAIT_MS = 600;
/** JavaScript that takes over later than this skips the animation and fades (CSS is about to give up anyway). */
export const LATE_TAKEOVER_MS = LOADER_BUDGET_SECONDS * 1000;

export type LoaderPlan = { mode: "animated"; speed: number } | { mode: "static" };

/**
 * The GSAP runtime arrives in its own chunk after hydration. Measured from when JavaScript took over, a late arrival
 * speeds the animation up so the loader still ends inside its budget; a very late one plays only the plain fade.
 */
export function planForLateness(latenessSeconds: number, timing: typeof LOADER_TIMING = LOADER_TIMING): LoaderPlan {
  const lateness = Math.max(0, latenessSeconds);
  const worst = worstCaseSeconds(timing);
  const available = LOADER_BUDGET_SECONDS - lateness;
  if (available >= worst) return { mode: "animated", speed: 1 };
  const speed = worst / Math.max(available, 0.001);
  return speed > MAX_SPEEDUP ? { mode: "static" } : { mode: "animated", speed };
}
