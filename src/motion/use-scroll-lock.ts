"use client";

import { useEffect } from "react";
import { lockSmoothScroll } from "./scroll";

/**
 * Pause Lenis smooth scrolling while `active` is true: the enquiry drawer, a lightbox, any modal that scrolls on its own.
 * Released on close, on unmount and on route change, so it can never stay locked. Native scroll locking (body
 * overflow) stays the modal's job; this only stops Lenis, which would otherwise keep scrolling the page behind the
 * modal. Put `data-lenis-prevent` on a scrollable modal panel so wheel scrolling inside it stays native.
 * Does nothing where Lenis is not running (touch, Tier B and C, reduced motion).
 */
export function useSmoothScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return lockSmoothScroll();
  }, [active]);
}
