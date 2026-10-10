/**
 * On-demand loader for the GSAP side of the motion layer. Owner: motion-lead.
 *
 * GSAP, ScrollTrigger, SplitText, DrawSVG and CustomEase together are about 50 KB gzipped, which would eat a quarter of
 * the initial JavaScript budget (BUILD_SPEC section 11). So nothing a page imports statically may touch them:
 * components and hooks import THIS file, which only holds a promise, and the runtime arrives in its own chunk right
 * after hydration (or sooner, when something asks for it).
 *
 *   const runtime = await loadMotion();      // { gsap, ScrollTrigger, inkDraw, splitReveal, boundaryCurtain, ... }
 *   const runtime = getMotion();             // synchronous: the runtime if it has already arrived, else null
 *
 * The thin layer (this file, hooks.ts, Reveal.tsx, MotionRoot.tsx, the transition, loader and cursor entry points) is
 * guarded by `bundle-boundary.test.ts`: it fails if any of them statically imports GSAP.
 */
export type MotionRuntime = typeof import("./runtime");

let pending: Promise<MotionRuntime> | undefined;
let loaded: MotionRuntime | null = null;

/** The runtime, loading it on first call. A failed load is not cached, so a later call retries. */
export function loadMotion(): Promise<MotionRuntime> {
  pending ??= import("./runtime").then(
    (runtime) => {
      loaded = runtime;
      return runtime;
    },
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}

/** The runtime if it has already loaded, else null. Never starts a load. */
export function getMotion(): MotionRuntime | null {
  return loaded;
}

/** Start loading without waiting (idle prefetch). Errors are ignored: whoever needs it calls `loadMotion` again. */
export function prefetchMotion(): void {
  loadMotion().catch(() => undefined);
}
