/**
 * Loading progress for the S1 loader. Owner: motion-lead.
 *
 * The counter must follow real loading: web fonts, the hero image decoding, and the window `load` event. The
 * maths is pure (and tested); `trackLoading` is the thin DOM layer that flips the three signals.
 */
import { clamp } from "@/motion/math";

export type LoadSignal = "fonts" | "hero" | "page";
export type LoadSignals = Record<LoadSignal, boolean>;

/** How much each signal is worth. The hero image is the heaviest and the one the visitor is waiting for. */
export const LOAD_WEIGHTS: Record<LoadSignal, number> = { fonts: 0.3, hero: 0.45, page: 0.25 };

/** Seconds. The whole loader, worst case, stays at or under 2 s (BUILD_SPEC S1). */
export const LOADER_TIMING = {
  /** The outline draws over this long. */
  draw: 0.9,
  /** Real loading is waited for at most this long from the start; then the reveal begins regardless. */
  loadCap: 1,
  /** The reveal: a beat, the plug fades, the township-shaped window grows to full bleed, the layer fades. */
  revealHold: 0.05,
  plugFade: 0.25,
  holeDelay: 0.1,
  hole: 0.7,
  rootFade: 0.12,
  /** Reduced motion and Tier C: a static outline for at least this long, at most `reducedCap`, then a fade. */
  reducedMin: 0.35,
  reducedCap: 1.2,
  reducedFade: 0.35,
  /** If JavaScript has not taken over by now, CSS hides the loader by itself (see loader.css). */
  failsafeMs: 4000,
} as const;

/** The longest the animated loader can last, in seconds, from the moment it starts. */
export function worstCaseSeconds(timing: typeof LOADER_TIMING = LOADER_TIMING): number {
  return timing.loadCap + timing.revealHold + timing.holeDelay + timing.hole + timing.rootFade;
}

/** The loader must be gone this many seconds after JavaScript takes over (BUILD_SPEC S1: max 2 s). */
export const LOADER_BUDGET_SECONDS = 2;
/** Beyond this speed-up the drawing would look frantic, so only the static outline and fade play. */
const MAX_SPEEDUP = 2.2;
/** If the motion runtime has not arrived by then, the loader leaves with a plain CSS fade rather than hold the page. */
export const RUNTIME_WAIT_MS = 2200;

export type LoaderPlan = { mode: "animated"; speed: number } | { mode: "static" };

/**
 * The GSAP runtime arrives in its own chunk after hydration. Measured from when JavaScript took over, a late arrival
 * speeds the animation up so the loader still ends inside its budget; a very late one plays only the static fade.
 */
export function planForLateness(latenessSeconds: number, timing: typeof LOADER_TIMING = LOADER_TIMING): LoaderPlan {
  const lateness = Math.max(0, latenessSeconds);
  const worst = worstCaseSeconds(timing);
  const available = LOADER_BUDGET_SECONDS - lateness;
  if (available >= worst) return { mode: "animated", speed: 1 };
  const speed = worst / Math.max(available, 0.001);
  return speed > MAX_SPEEDUP ? { mode: "static" } : { mode: "animated", speed };
}

/** Share of the weighted signals that have completed, 0 to 1. */
export function loadFraction(signals: LoadSignals, weights: Record<LoadSignal, number> = LOAD_WEIGHTS): number {
  let total = 0;
  let done = 0;
  for (const key of Object.keys(weights) as LoadSignal[]) {
    total += weights[key];
    if (signals[key]) done += weights[key];
  }
  return total > 0 ? done / total : 1;
}

/** What the counter shows: never ahead of the line that is being drawn, never ahead of what has really loaded. */
export function displayedPercent(realFraction: number, drawProgress: number): number {
  return clamp(Math.min(realFraction, drawProgress), 0, 1) * 100;
}

/** The reveal may begin once the line is drawn and either everything has loaded or the wait has been capped. */
export function canReveal(drawProgress: number, realFraction: number, capped: boolean): boolean {
  return drawProgress >= 1 && (realFraction >= 1 || capped);
}

/** The hero `<img>` behind `selector` (the element itself, or the first image inside it). */
export function findHeroImage(selector: string, root: ParentNode = document): HTMLImageElement | null {
  let element: Element | null = null;
  try {
    element = root.querySelector(selector);
  } catch {
    return null;
  }
  if (element instanceof HTMLImageElement) return element;
  return element?.querySelector("img") ?? null;
}

/** Resolves once the image is loaded and decoded, or has failed (a broken hero must never hold the loader). */
export function decodeImage(image: HTMLImageElement): Promise<void> {
  const decode = () => (image.decode ? image.decode().catch(() => undefined) : Promise.resolve());
  if (image.complete && image.naturalWidth > 0) return decode();
  return new Promise<void>((resolve) => {
    const settle = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", settle);
      resolve();
    };
    const onLoad = () => {
      void decode().then(settle);
    };
    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", settle, { once: true });
  });
}

/**
 * Watches fonts, the hero image and the window load. Calls `onSignal(name)` once per signal. Returns a cleanup that
 * stops listening. Signals with nothing to wait for (no hero on the page, no Font Loading API) fire at once.
 */
export function trackLoading(heroSelector: string, onSignal: (signal: LoadSignal) => void): () => void {
  let cancelled = false;
  const mark = (signal: LoadSignal) => {
    if (!cancelled) onSignal(signal);
  };

  const fonts = typeof document !== "undefined" ? document.fonts?.ready : undefined;
  if (fonts) fonts.then(() => mark("fonts"), () => mark("fonts"));
  else mark("fonts");

  const onWindowLoad = () => mark("page");
  if (document.readyState === "complete") mark("page");
  else window.addEventListener("load", onWindowLoad, { once: true });

  const hero = findHeroImage(heroSelector);
  if (hero) void decodeImage(hero).then(() => mark("hero"));
  else mark("hero");

  return () => {
    cancelled = true;
    window.removeEventListener("load", onWindowLoad);
  };
}
