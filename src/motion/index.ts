/**
 * Motion primitives (BUILD_SPEC S7): the plan's own shapes as the site's motion language.
 *
 * Contract written by the Director; bodies are owned and implemented by motion-lead.
 * Keep these names and signatures; add options, never remove them.
 *
 * Rules: GSAP owns scroll, SVG and timelines (these primitives); Motion owns component state.
 * Animate transform and opacity only (SVG stroke-dashoffset via DrawSVG is the exception).
 * Every primitive must honour `reduced: true` by returning a timeline that only fades (or sets the end state).
 */
import { gsap } from "gsap";

export type Timeline = gsap.core.Timeline;
export type Targets = gsap.TweenTarget;

export interface PrimitiveOptions {
  /** Reduced motion or Tier C: skip movement, fade or jump to the end state. */
  reduced?: boolean;
  duration?: number;
  delay?: number;
  ease?: string;
  /** Start paused so a caller (ScrollTrigger, transition provider) can drive it. */
  paused?: boolean;
}

/** Named eases shared by every primitive. "draft" is a CustomEase registered by `registerMotion()`. */
export const EASE = {
  draft: "draft",
  out: "power3.out",
  expo: "expo.out",
  inOut: "power3.inOut",
} as const;

export const DURATION = {
  quick: 0.35,
  base: 0.7,
  slow: 1.2,
  draw: 1.6,
} as const;

/** Register GSAP plugins and the "draft" CustomEase once, on the client. Idempotent. */
export function registerMotion(): void {
  // TODO(motion-lead): register ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, CustomEase, Observer.
}

/** Draw SVG strokes like ink on paper (DrawSVG). Used by the loader, the plan draw-in and dimension lines. */
export function inkDraw(targets: Targets, options: PrimitiveOptions & { stagger?: number } = {}): Timeline {
  void targets;
  return gsap.timeline({ paused: options.paused });
}

/** Split text into lines or words and reveal them from a mask. Call `revert` on cleanup. */
export function splitReveal(
  target: Element,
  options: PrimitiveOptions & { by?: "lines" | "words" | "chars"; stagger?: number } = {},
): { timeline: Timeline; revert: () => void } {
  void target;
  return { timeline: gsap.timeline({ paused: options.paused }), revert: () => undefined };
}

/** A dimension line with end ticks draws, then the value counts up inside it. */
export function dimensionCount(
  elements: { line: SVGGeometryElement; ticks?: SVGGeometryElement[]; output: HTMLElement },
  options: PrimitiveOptions & { value: number; format?: (value: number) => string },
): Timeline {
  void elements;
  return gsap.timeline({ paused: options.paused });
}

/** Page curtain cut from the township boundary: "cover" wipes it over the page, "reveal" opens the next one. */
export function boundaryCurtain(
  curtain: SVGElement | HTMLElement,
  options: PrimitiveOptions & { phase: "cover" | "reveal" },
): Timeline {
  void curtain;
  return gsap.timeline({ paused: options.paused });
}

/** Iris cut from the roundabout circle, opening or closing around an origin (viewport px). */
export function roundaboutIris(
  target: HTMLElement,
  options: PrimitiveOptions & { phase: "open" | "close"; origin?: { x: number; y: number } },
): Timeline {
  void target;
  return gsap.timeline({ paused: options.paused });
}

/** Horizontal wipe line, the 40' boulevard, used between sections. */
export function boulevardWipe(
  target: HTMLElement,
  options: PrimitiveOptions & { direction?: "ltr" | "rtl" } = {},
): Timeline {
  void target;
  return gsap.timeline({ paused: options.paused });
}

/** Staggered "blinds" reveal cut from the row-house strips, for galleries. */
export function stripBlinds(
  targets: HTMLElement | HTMLElement[],
  options: PrimitiveOptions & { strips?: number; stagger?: number; orientation?: "vertical" | "horizontal" } = {},
): Timeline {
  void targets;
  return gsap.timeline({ paused: options.paused });
}
