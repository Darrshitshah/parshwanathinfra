"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * True once the element is within `rootMargin` of the viewport (and stays true). Without IntersectionObserver: soon
 * after mount. Used by the lazy slots (Living Plan, building explorer) and the live map to load their code on demand.
 */
export function useNear<T extends Element>(rootMargin = "900px 0px"): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setNear(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return [ref, near];
}
