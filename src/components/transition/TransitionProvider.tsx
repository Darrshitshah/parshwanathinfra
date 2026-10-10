"use client";

/**
 * Page transitions for the App Router. Owner: motion-lead. Mounted by `MotionRoot`.
 *
 * Why not `next-transition-router` (0.2.11)? It was read against Next 16.4 and not adopted:
 *  - its stage machine has no guard: if a leave animation throws or never calls `next`, the stage stays "leaving" and
 *    every later internal click is swallowed (it calls preventDefault, then returns early);
 *  - nothing enforces the 900 ms cap on delaying navigation, and a leave animation that finishes after Back was
 *    pressed still calls `router.push`, so navigation can fire twice;
 *  - its auto mode pulls in `delegate-it` and a Node `url` polyfill, and it intercepts same-origin file links (pdf,
 *    images) that the browser should open itself;
 *  - it cannot show the next page's title or load the GSAP runtime lazily.
 * This provider is small, owns those guarantees, and works with plain `next/link` (no special Link component).
 *
 * How it works: a capture-phase click listener on `window` runs before React and Next's `<Link>`. When the click is
 * an ordinary internal navigation (see `link-rules.ts`) it calls `preventDefault` (Next's Link then does nothing),
 * plays the curtain, calls `router.push`, and opens the curtain when `usePathname()` changes. Everything else,
 * including Back/Forward, new tabs, downloads, external links and Tier C, is left to the browser and Next.
 * If the GSAP runtime has not loaded yet the click is simply not intercepted (it loads at idle, well before a click).
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { createHole, type HoleController } from "@/motion/hole";
import { getMotion, loadMotion, prefetchMotion } from "@/motion/load";
import { scrollToTopOrHash } from "@/motion/scroll";
import { noteClientNavigation } from "@/motion/session";
import type { TownshipShape } from "@/motion/township";
import { useTownshipShape } from "@/motion/use-township-shape";
import { Curtain } from "./Curtain";
import { TransitionContext, type TransitionApi } from "./context";
import { createTransitionController, type TransitionController } from "./controller";
import { handleHashClick } from "./hash-scroll";
import { evaluateClick, findAnchor, toRouterHref } from "./link-rules";
import { resolveTransitionTitle, ROOT_TITLE, titleFromPath } from "./titles";

export interface TransitionProviderProps {
  children: ReactNode;
  /** Township shape for the Tier A curtain. Without it the plan is loaded lazily, and the panel curtain is used meanwhile. */
  shape?: TownshipShape;
}

export function TransitionProvider({ children, shape }: TransitionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, tier, reducedMotion } = useDeviceTier();

  const townshipShape = useTownshipShape(shape, ready && tier !== "C");
  const enabled = ready && tier !== "C" && !reducedMotion;
  const reduced = tier === "C" || reducedMotion;
  const variant: "hole" | "panel" = tier === "A" && townshipShape ? "hole" : "panel";

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const holePathRef = useRef<SVGPathElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const holeRef = useRef<HoleController | null>(null);
  const controllerRef = useRef<TransitionController | null>(null);
  const initialPathRef = useRef(pathname);
  // The controller outlives renders; it reads the newest values through this ref.
  const latest = useRef({ router, variant, reduced, enabled });
  useEffect(() => {
    latest.current = { router, variant, reduced, enabled };
  });

  // The motion runtime (GSAP) loads at idle once transitions are on, so it is there long before the first click.
  useEffect(() => {
    if (!enabled) return;
    const idle = window.requestIdleCallback?.(prefetchMotion, { timeout: 2000 });
    const timer = idle === undefined ? window.setTimeout(prefetchMotion, 800) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [enabled]);

  // The township-shaped hole, once the SVG exists.
  useEffect(() => {
    const path = holePathRef.current;
    if (!path || !townshipShape) return;
    const hole = createHole(path, townshipShape.boundary, { svg: svgRef.current });
    hole.setScale(0);
    holeRef.current = hole;
    return () => {
      holeRef.current = null;
    };
  }, [townshipShape]);

  // The state machine. Created once; aborted on unmount so no timer, timeline or flag outlives it.
  useEffect(() => {
    const controller = createTransitionController({
      runtime: () => getMotion(),
      root: () => rootRef.current,
      label: () => labelRef.current,
      hole: () => holeRef.current,
      variant: () => latest.current.variant,
      reduced: () => latest.current.reduced,
      push: (href, replace) => {
        noteClientNavigation();
        const { router: current } = latest.current;
        if (replace) current.replace(href);
        else current.push(href);
      },
      prefetch: (href) => latest.current.router.prefetch(href),
      arrived: (hash) => {
        scrollToTopOrHash(hash);
        // New page, new layout: let its ScrollTriggers measure after two frames.
        requestAnimationFrame(() => requestAnimationFrame(() => getMotion()?.ScrollTrigger.refresh()));
      },
    });
    controllerRef.current = controller;
    return () => {
      controller.abort();
      controllerRef.current = null;
    };
  }, []);

  // Route changes: tell the controller, and remember that this document has navigated client-side.
  useEffect(() => {
    if (pathname !== initialPathRef.current) noteClientNavigation();
    controllerRef.current?.notifyPathname(pathname);
  }, [pathname]);

  // Back and Forward always work and never get a curtain: drop whatever is running and get out of the way.
  useEffect(() => {
    const onPopState = () => {
      noteClientNavigation();
      controllerRef.current?.abort();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // The click listener. Capture phase on window: before React, so Next's <Link> sees defaultPrevented.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = findAnchor(event.target);
      const decision = evaluateClick(anchor, event, window.location);
      if (!anchor || decision.kind === "native") return;

      if (decision.kind === "hash") {
        handleHashClick(decision.url, event);
        return;
      }

      noteClientNavigation();
      if (!enabled) return;
      const controller = controllerRef.current;
      if (!controller) return;
      const result = controller.start(toRouterHref(decision.url), { title: resolveTransitionTitle(anchor, decision.url) });
      // "unavailable": the curtain or the runtime is not there. Let Next navigate on its own rather than swallow the click.
      if (result !== "unavailable") event.preventDefault();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [enabled]);

  // Turning transitions off (reduced motion toggled, tier change) while one is running must not strand the curtain.
  useEffect(() => {
    if (!enabled) controllerRef.current?.abort();
  }, [enabled]);

  const api = useMemo<TransitionApi>(
    () => ({
      enabled,
      navigate: (href, options) => {
        const controller = controllerRef.current;
        if (!enabled || !controller) return "disabled";
        const url = new URL(href, window.location.href);
        const result = controller.start(toRouterHref(url), {
          title: options?.title ?? titleFromPath(url.pathname),
          replace: options?.replace,
        });
        return result === "started" ? "started" : result === "busy" ? "busy" : "disabled";
      },
      // The manual API works on every tier (reduced tiers get the fade), so it loads the runtime itself when needed.
      cover: async (title) => {
        await loadMotion().catch(() => undefined);
        await controllerRef.current?.cover(title ?? ROOT_TITLE);
      },
      reveal: async () => {
        await controllerRef.current?.reveal();
      },
      isBusy: () => controllerRef.current?.isBusy() ?? false,
    }),
    [enabled],
  );

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <Curtain
        rootRef={rootRef}
        svgRef={svgRef}
        holeRef={holePathRef}
        labelRef={labelRef}
        boundary={townshipShape?.boundary ?? null}
        variant={variant}
      />
    </TransitionContext.Provider>
  );
}
