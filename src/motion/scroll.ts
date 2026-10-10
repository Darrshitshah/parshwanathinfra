/**
 * Scroll access shared by every lead. Owner: motion-lead.
 *
 * `MotionRoot` creates one Lenis instance on Tier A with a fine pointer and registers it here. Everything else
 * (anchors, the page transition, "scroll to section" buttons, drawers) goes through these helpers, which also work
 * with native scrolling when Lenis is off, so callers never need to know which one is running.
 */
import type Lenis from "lenis";

let instance: Lenis | null = null;
let lockCount = 0;

/** Called by MotionRoot only. */
export function setLenis(next: Lenis | null): void {
  instance = next;
  if (next && lockCount > 0) next.stop();
}

/** The running Lenis instance, or null (touch devices, reduced motion, Tier B and C, before mount). */
export function getLenis(): Lenis | null {
  return instance;
}

export interface ScrollTargetOptions {
  /** Pixels added to the target position (negative scrolls less far, e.g. for a sticky header). */
  offset?: number;
  /** Jump without animation. */
  immediate?: boolean;
  /** Seconds, smooth scrolling only. */
  duration?: number;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target !== "string") return target;
  try {
    return target.startsWith("#")
      ? document.getElementById(decodeURIComponent(target.slice(1)))
      : document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

/**
 * Scroll to a pixel position, an element or a selector / "#hash". Smooth with Lenis, native smooth otherwise,
 * instant for reduced motion. Honours CSS `scroll-margin-top` on the target and `scroll-padding-top` on the page.
 */
export function scrollToTarget(target: number | string | HTMLElement, options: ScrollTargetOptions = {}): void {
  if (typeof window === "undefined") return;
  const { offset = 0, immediate = false, duration } = options;
  const instant = immediate || prefersReducedMotion();

  if (instance) {
    instance.scrollTo(target, { offset, immediate: instant, duration, force: true });
    return;
  }

  const behavior: ScrollBehavior = instant ? "auto" : "smooth";
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior });
    return;
  }
  const element = resolveElement(target);
  if (!element) return;
  if (offset === 0) {
    element.scrollIntoView({ behavior, block: "start" });
    return;
  }
  const top = element.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior });
}

/** Jump to the top of the page, or to the element named by `hash` ("#team"), without animation. */
export function scrollToTopOrHash(hash = ""): void {
  if (typeof window === "undefined") return;
  if (hash && hash !== "#" && resolveElement(hash)) {
    scrollToTarget(hash, { immediate: true });
    return;
  }
  scrollToTarget(0, { immediate: true });
}

/**
 * Pause smooth scrolling while something modal is open (the enquiry drawer, a lightbox). Returns the release
 * function, which you MUST call (a lock that is never released leaves smooth scrolling stopped for the whole session);
 * in React use `useSmoothScrollLock(open)` from `use-scroll-lock.ts`, which releases it for you.
 * Calls nest: scrolling resumes when every lock has been released. Native scroll locking (body overflow)
 * stays the caller's job; this only stops Lenis, which would otherwise keep scrolling the page behind the modal.
 * Put `data-lenis-prevent` on a scrollable modal panel so wheel scrolling inside it stays native.
 */
export function lockSmoothScroll(): () => void {
  lockCount += 1;
  instance?.stop();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) instance?.start();
  };
}
