/**
 * The page-transition state machine. Owner: motion-lead. Plain TypeScript: React only wires it up.
 *
 *   click ─► covering ─► covered (router.push issued) ─► new route arrives ─► revealing ─► done
 *
 * The GSAP runtime is injected (`env.runtime()`), so this file stays in the thin layer and GSAP stays out of the
 * initial bundle. Without the runtime a click is not intercepted: Next navigates normally.
 *
 * Guarantees:
 *  - `router.push` is called as soon as the page is hidden, and never later than COVER_PUSH_LIMIT_MS after the
 *    click, even if the animation stalls. So a transition never delays navigation by more than 900 ms.
 *  - If the route does not arrive within ROUTE_WAIT_LIMIT_MS the curtain opens anyway.
 *  - Every timer, timeline and DOM flag is cleaned up by `abort()` (Back/Forward, unmount, tier change).
 *  - While a run is active, further internal link clicks are ignored (no queued double navigation).
 */
import type { HoleController } from "@/motion/hole";
import type { MotionRuntime } from "@/motion/load";
import type { Timeline } from "@/motion/types";

/** Hard cap from click to `router.push`. Must stay below 900 ms (BUILD_SPEC section 2). */
export const COVER_PUSH_LIMIT_MS = 850;
export const ROUTE_WAIT_LIMIT_MS = 6000;
export const REVEAL_LIMIT_MS = 2500;
/** The title stays readable for this long after it has finished sliding in. */
export const TITLE_HOLD_MS = 120;
/** A run older than this is considered stuck and replaced by the next click. */
const STALE_RUN_MS = 9000;
const MANUAL_LIMIT_MS = 20000;

export type StartResult = "started" | "busy" | "unavailable";
type RunMode = "navigate" | "manual";
type RunPhase = "covering" | "covered" | "revealing";

export interface ControllerEnv {
  /** The GSAP runtime if it has loaded, else null (then no transition starts and links behave normally). */
  runtime(): MotionRuntime | null;
  root(): HTMLElement | null;
  label(): HTMLElement | null;
  hole(): HoleController | null;
  variant(): "hole" | "panel";
  /** Reduced motion or Tier C: fades only. */
  reduced(): boolean;
  push(href: string, replace: boolean): void;
  prefetch(href: string): void;
  /** The new route is mounted (still behind the curtain): reset scroll and refresh scroll triggers. */
  arrived(hash: string): void;
}

export interface StartOptions {
  title: string;
  replace?: boolean;
}

export interface TransitionController {
  start(href: string, options: StartOptions): StartResult;
  /** Play the cover on its own; resolves when the page is hidden. Pair with `reveal()`. */
  cover(title: string): Promise<void>;
  /** Open the curtain; resolves when it is gone. */
  reveal(): Promise<void>;
  /** Tell the controller the pathname changed (call from an effect on `usePathname()`). */
  notifyPathname(pathname: string): void;
  abort(): void;
  isBusy(): boolean;
}

interface Run {
  id: number;
  mode: RunMode;
  phase: RunPhase;
  href: string;
  hash: string;
  fromPath: string;
  replace: boolean;
  startedAt: number;
  timeline: Timeline | null;
  timers: number[];
  resolveCovered?: () => void;
  resolveRevealed?: () => void;
}

function hashOf(href: string): string {
  try {
    return new URL(href, window.location.href).hash;
  } catch {
    return "";
  }
}

export function createTransitionController(env: ControllerEnv): TransitionController {
  let run: Run | null = null;
  let counter = 0;

  const setFlag = (value: RunPhase | null) => {
    const html = document.documentElement;
    if (value) html.dataset.transition = value;
    else delete html.dataset.transition;
  };

  const clearTimers = (target: Run) => {
    target.timers.forEach((id) => window.clearTimeout(id));
    target.timers.length = 0;
  };

  const later = (target: Run, ms: number, callback: () => void) => {
    target.timers.push(window.setTimeout(callback, ms));
  };

  const hideCurtain = () => {
    const root = env.root();
    if (root) {
      root.style.opacity = "0";
      root.style.visibility = "hidden";
      root.style.pointerEvents = "none";
    }
    env.hole()?.setScale(0);
  };

  function remainingCoverMs(target: Run): number {
    const timeline = target.timeline;
    if (!timeline) return 0;
    return Math.max(0, (timeline.duration() - timeline.time()) * 1000);
  }

  function finish(id: number): void {
    if (!run || run.id !== id) return;
    const finished = run;
    clearTimers(finished);
    finished.timeline?.kill();
    hideCurtain();
    run = null;
    setFlag(null);
    finished.resolveRevealed?.();
  }

  function startReveal(id: number): void {
    if (!run || run.id !== id || run.phase === "revealing") return;
    const current = run;
    const root = env.root();
    const runtime = env.runtime();
    clearTimers(current);
    current.phase = "revealing";
    setFlag("revealing");
    current.timeline?.progress(1).kill();
    if (!root || !runtime) {
      finish(id);
      return;
    }
    const timeline = runtime.boundaryCurtain(root, {
      phase: "reveal",
      hole: env.hole(),
      variant: env.variant(),
      reduced: env.reduced(),
    });
    timeline.eventCallback("onComplete", () => finish(id));
    current.timeline = timeline;
    later(current, REVEAL_LIMIT_MS, () => finish(id));
  }

  function onCovered(id: number): void {
    if (!run || run.id !== id || run.phase !== "covering") return;
    const current = run;
    clearTimers(current);
    current.phase = "covered";
    setFlag("covered");
    current.resolveCovered?.();

    if (current.mode === "manual") {
      later(current, MANUAL_LIMIT_MS, () => startReveal(id));
      return;
    }
    later(current, ROUTE_WAIT_LIMIT_MS, () => startReveal(id));
    try {
      env.push(current.href, current.replace);
    } catch {
      // The router refused (it should not): fall back to a full page load rather than leave the user stuck.
      window.location.assign(current.href);
    }
  }

  function begin(mode: RunMode, title: string, href: string, replace: boolean): Run | null {
    const root = env.root();
    const runtime = env.runtime();
    if (!root || !runtime) return null;
    if (run && performance.now() - run.startedAt > STALE_RUN_MS) abort();
    if (run) return null;

    const current: Run = {
      id: (counter += 1),
      mode,
      phase: "covering",
      href,
      hash: hashOf(href),
      fromPath: window.location.pathname,
      replace,
      startedAt: performance.now(),
      timeline: null,
      timers: [],
    };
    run = current;
    setFlag("covering");

    const label = env.label();
    if (label) label.textContent = title;

    current.timeline = runtime.boundaryCurtain(root, {
      phase: "cover",
      hole: env.hole(),
      variant: env.variant(),
      reduced: env.reduced(),
      onCovered: () => onCovered(current.id),
    });
    if (mode === "navigate") later(current, COVER_PUSH_LIMIT_MS, () => onCovered(current.id));
    return current;
  }

  function abort(): void {
    if (!run) return;
    const aborted = run;
    clearTimers(aborted);
    aborted.timeline?.kill();
    hideCurtain();
    run = null;
    setFlag(null);
    aborted.resolveCovered?.();
    aborted.resolveRevealed?.();
  }

  return {
    start(href, options) {
      if (!env.root() || !env.runtime()) return "unavailable";
      const current = begin("navigate", options.title, href, options.replace ?? false);
      if (!current) return "busy";
      try {
        env.prefetch(href);
      } catch {
        // Prefetch is only a head start.
      }
      return "started";
    },

    cover(title) {
      return new Promise<void>((resolve) => {
        const current = begin("manual", title, "", false);
        if (!current) {
          resolve();
          return;
        }
        current.resolveCovered = resolve;
      });
    },

    reveal() {
      return new Promise<void>((resolve) => {
        if (!run) {
          resolve();
          return;
        }
        run.resolveRevealed = resolve;
        startReveal(run.id);
      });
    },

    notifyPathname(pathname) {
      if (!run || run.mode !== "navigate") return;
      if (run.phase === "covering") {
        // Something other than this transition changed the route (Back, a redirect): do not fight it.
        abort();
        return;
      }
      if (run.phase !== "covered" || pathname === run.fromPath) return;
      const current = run;
      clearTimers(current);
      env.arrived(current.hash);
      later(current, remainingCoverMs(current) + TITLE_HOLD_MS, () => startReveal(current.id));
    },

    abort,

    isBusy: () => run !== null,
  };
}
