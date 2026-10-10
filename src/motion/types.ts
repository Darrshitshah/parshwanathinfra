/**
 * Shared motion types. Owner: motion-lead. Re-exported from `src/motion/index.ts`.
 */
import type { gsap } from "gsap";

export type Timeline = gsap.core.Timeline;
export type Targets = gsap.TweenTarget;

/** What `splitReveal` animates: whole lines, words, or single characters. */
export type SplitUnit = "lines" | "words" | "chars";

export interface PrimitiveOptions {
  /** Reduced motion or Tier C: skip movement, fade or jump to the end state. */
  reduced?: boolean;
  duration?: number;
  delay?: number;
  ease?: string;
  /** Start paused so a caller (ScrollTrigger, transition provider) can drive it. */
  paused?: boolean;
}
