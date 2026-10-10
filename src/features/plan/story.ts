import { interpCam, type Cam } from "./camera";

/**
 * Timeline layout of the scroll story. Pure, so the chapter text and hotspots can be tested without scrolling.
 *
 * Timeline units: an intro hold on the whole plan, then for each chapter a travel of 1 unit followed by a hold.
 *   [0, INTRO_HOLD]                         the whole township
 *   [INTRO_HOLD + k*STEP, ... + TRAVEL]     travel into chapter k
 *   [... + TRAVEL, INTRO_HOLD + (k+1)*STEP] hold on chapter k (hotspots visible)
 */
export const INTRO_HOLD = 0.6;
export const TRAVEL = 1;
export const HOLD = 0.9;
export const STEP = TRAVEL + HOLD;
/** The card text switches halfway through a travel; hotspots fade in once the camera has arrived. */
const CARD_SWITCH = TRAVEL * 0.5;
const SPOTS_IN = TRAVEL * 0.95;

export function storyDuration(chapterCount: number): number {
  return INTRO_HOLD + chapterCount * STEP;
}

export function chapterStart(k: number): number {
  return INTRO_HOLD + k * STEP;
}

export interface StoryPhase {
  /** Chapter whose text shows: -1 is the intro. */
  card: number;
  /** Chapter whose hotspots are visible, or null while travelling. */
  spots: number | null;
}

export function storyPhase(t: number, chapterCount: number): StoryPhase {
  if (chapterCount <= 0 || t < INTRO_HOLD) return { card: -1, spots: null };
  if (t >= storyDuration(chapterCount)) return { card: chapterCount - 1, spots: chapterCount - 1 };
  const k = Math.min(chapterCount - 1, Math.floor((t - INTRO_HOLD) / STEP));
  const local = t - chapterStart(k);
  return { card: local >= CARD_SWITCH ? k : k - 1, spots: local >= SPOTS_IN ? k : null };
}

/** Quadratic ease in and out: the camera leaves and arrives gently. */
export function easeInOut(u: number): number {
  const x = Math.min(Math.max(u, 0), 1);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * Where the camera is at timeline time `t`, given the camera of the whole plan (index 0) and of each chapter
 * (indices 1 to n). A pure function of time, so scrolling back and forth, or jumping, always lands on the same view.
 */
export function cameraAtTime(t: number, stops: readonly Cam[]): Cam {
  const chapterCount = stops.length - 1;
  if (chapterCount <= 0 || t <= INTRO_HOLD) return stops[0];
  if (t >= storyDuration(chapterCount)) return stops[chapterCount];
  const k = Math.min(chapterCount - 1, Math.floor((t - INTRO_HOLD) / STEP));
  const travelled = (t - chapterStart(k)) / TRAVEL;
  return travelled >= 1 ? stops[k + 1] : interpCam(stops[k], stops[k + 1], easeInOut(travelled));
}

/** Scroll distance of the pin, in viewport heights per chapter: shorter on Tier B. */
export function scrollPerChapter(tier: "A" | "B"): number {
  return tier === "A" ? 0.95 : 0.6;
}
