/**
 * Motion primitives (BUILD_SPEC S7): the plan's own shapes as the site's motion language.
 *
 * Contract written by the Director; bodies are owned and implemented by motion-lead.
 * Keep these names and signatures; add options, never remove them.
 *
 * Rules: GSAP owns scroll, SVG and timelines (these primitives); Motion owns component state.
 * Animate transform and opacity only. The allowed exceptions, all paint-only (never layout): SVG stroke dashes via
 * DrawSVG; clip-path for the iris, the wipe and the blinds; and the township-shaped hole of the page curtain, whose SVG
 * path data is rewritten each frame (it has to cut a shape out of a sheet, which no transform can do). Visibility and
 * pointer-events are toggled at the ends of a curtain. Every primitive honours `reduced: true` by returning a
 * timeline that only fades (or sets the end state).
 *
 * IMPORTANT, bundle size: this barrel and everything under `primitives/` import GSAP statically (about 50 KB gzipped).
 * Do NOT import it from a component or page that ships in the initial bundle. Use the thin layer instead:
 *   `await loadMotion()` / `getMotion()` from `@/motion/load` (the runtime arrives in its own chunk after hydration),
 *   the hooks and components below, or `useMotionEffect`. `bundle-boundary.test.ts` guards the thin layer.
 * Constants are safe anywhere: `@/motion/constants`.
 *
 * React pieces live next to this barrel:
 *   `@/motion/use-scroll-lock`  useSmoothScrollLock(open) for modals
 *   `@/motion/hooks`        useMotionEffect, useSplitReveal, useInkDraw, useDimensionCount, useStripBlinds, useBoulevardWipe, useParallax, ...
 *   `@/motion/Reveal`       <Reveal kind="split|ink|blinds|wipe|fade">, <DimensionStat>, <Parallax>
 *   `@/motion/MotionRoot`   mounted once by layout.tsx
 *   `@/components/cursor`   <Magnetic>, useMagnetic, data-cursor attributes
 *   `@/components/loader`   <BoundaryLoader>
 *   `@/components/transition` useTransition, useTransitionRouter, data-transition attributes
 */

export type { PrimitiveOptions, Targets, Timeline } from "./types";
export { DURATION, EASE } from "./constants";
export { registerMotion } from "./setup";

export { inkDraw, type InkDrawOptions } from "./primitives/ink-draw";
export { splitReveal, type SplitRevealOptions, type SplitUnit } from "./primitives/split-reveal";
export { countTo, dimensionCount, type DimensionCountOptions, type DimensionElements } from "./primitives/dimension-count";
export { boundaryCurtain, CURTAIN_TIMING, type BoundaryCurtainOptions } from "./primitives/boundary-curtain";
export { roundaboutIris, type RoundaboutIrisOptions } from "./primitives/roundabout-iris";
export { boulevardWipe, type BoulevardWipeOptions } from "./primitives/boulevard-wipe";
export { stripBlinds, type StripBlindsOptions } from "./primitives/strip-blinds";

export { loadFlip, loadMorphSVG, loadObserver } from "./lazy";
export { createNumberFormatter, formatCounter, formatIndian } from "./format";
export { getLenis, lockSmoothScroll, scrollToTarget, scrollToTopOrHash, type ScrollTargetOptions } from "./scroll";
export { createHole, type HoleController } from "./hole";
export type { Bounds, Point, Rect, ViewBox } from "./geometry";
