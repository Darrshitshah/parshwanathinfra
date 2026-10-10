"use client";

/**
 * S1 loader: the township boundary draws itself. Owner: motion-lead.
 *
 * The real site boundary draws as one continuous ink line (DrawSVG) over a faint pencil guide, with the roundabout
 * dot and the main-entry arrow. A mono counter 0 to 100 follows real loading (fonts, the hero image decoding, the
 * window load). Then the plug inside the outline fades, the page shows through the township-shaped window, and the
 * window grows to full bleed. Worst case 2 s; it is never allowed to block the page for longer.
 *
 * Mount it once on Home, near the top of the page (it is position: fixed, so it never shifts layout):
 *   <BoundaryLoader {...shapeFromPlan(plan)} />        // from a server component: geometry arrives as props
 *   <img data-hero-image ... />                        // or put the marker on a wrapper; see `heroSelector`
 *
 * It renders in the server HTML so first paint is already covered, then hands over to JavaScript:
 *  - without JavaScript it never shows (loader.css only shows it under html[data-js="1"]);
 *  - after it has played once in a session (sessionStorage "pi-loader-seen"), or when the visitor arrived on this page
 *    by navigating (the curtain already covered the change), it never shows;
 *  - if JavaScript is slow to start, CSS hides it by itself after a few seconds;
 *  - the GSAP runtime loads in its own chunk after hydration; until it arrives the pencil outline and "000%" show,
 *    a late arrival speeds the animation up to stay inside 2 s, and one that never arrives gets a plain fade out;
 *  - reduced motion and Tier C: a static outline, then a fade.
 * Geometry is props only: the plan is the single source of coordinates. Thin layer: no static GSAP import.
 */
import { useEffect, useMemo, useRef } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { EASE } from "@/motion/constants";
import { formatCounter } from "@/motion/format";
import {
  coverScale,
  entryArrow,
  outerRect,
  paddedViewBox,
  polygonBounds,
  polygonCentroid,
  polygonToPath,
  sheetWithHolePath,
  unionBounds,
  type Point,
} from "@/motion/geometry";
import { measureViewportRect } from "@/motion/hole";
import { loadMotion, type MotionRuntime } from "@/motion/load";
import { hasNavigatedClientSide } from "@/motion/session";
import { present } from "@/motion/util";
import "./loader.css";
import {
  canReveal,
  displayedPercent,
  LOADER_TIMING,
  loadFraction,
  planForLateness,
  RUNTIME_WAIT_MS,
  trackLoading,
  type LoaderPlan,
  type LoadSignals,
} from "./progress";

export const LOADER_SEEN_KEY = "pi-loader-seen";
const DEFAULT_HERO_SELECTOR = "[data-hero-image]";
/** The entry arrow is this fraction of the township's longest side. */
const ARROW_SIZE_RATIO = 0.05;
const FALLBACK_FULL_SCALE = 4;
const FALLBACK_EXIT_MS = 380;

type PointLike = readonly [number, number];

export interface BoundaryLoaderProps {
  /** The site boundary on the render grid (plan.boundary). */
  boundary: readonly PointLike[];
  /** The roundabout: drawn as a brick-red dot (plan.roundabout). */
  roundabout?: { center: PointLike; radius: number };
  /** The main entry: drawn as an arrow pointing into the township (the "main" entry of plan.entries). */
  entry?: PointLike;
  /** SVG viewBox. Default: the boundary and arrow with a 10% margin. */
  viewBox?: readonly [number, number, number, number];
  /** CSS selector of the hero image, or of a wrapper around it. Default `[data-hero-image]`. */
  heroSelector?: string;
  /** Called once when the loader has finished, or (just after mount) when it is skipped. */
  onDone?: () => void;
  /** Review tools only: do not read or write the session flag, so the loader can be replayed. Default true. */
  persist?: boolean;
  /** Review tools only: play the reduced-motion version (static outline, then a fade) on any tier. */
  forceStatic?: boolean;
}

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(LOADER_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen(): void {
  try {
    window.sessionStorage.setItem(LOADER_SEEN_KEY, "1");
  } catch {
    // Private mode: the loader simply plays again next time.
  }
  document.documentElement.dataset.loader = "seen";
}

interface LoaderParts {
  root: HTMLDivElement;
  svg: SVGSVGElement;
  group: SVGGElement;
  plug: SVGPathElement;
  guide: SVGPathElement;
  ink: SVGPathElement;
  arrow: SVGPathElement | null;
  dot: SVGCircleElement | null;
  counter: HTMLParagraphElement;
  digits: HTMLSpanElement;
}

interface PlayInput {
  runtime: MotionRuntime;
  plan: LoaderPlan;
  parts: LoaderParts;
  signals: LoadSignals;
  points: readonly Point[];
  origin: Point;
  finish: () => void;
}

/** The GSAP part. Everything it creates lives in one context, so the returned cleanup stops all of it. */
function play({ runtime, plan, parts, signals, points, origin, finish }: PlayInput): () => void {
  const { gsap } = runtime;
  const { root, svg, group, plug, guide, ink, arrow, dot, counter, digits } = parts;
  const timing = LOADER_TIMING;
  const lines = present<SVGPathElement>(ink, arrow);
  const accents = present<SVGElement>(ink, guide, arrow, dot);
  let tick: (() => void) | null = null;

  const context = gsap.context(() => {
    gsap.set([...lines, dot], { opacity: 1 });

    if (plan.mode === "static") {
      // A static outline, then a fade. Wait for real loading, but never longer than the cap.
      const startedAt = performance.now();
      tick = () => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const loaded = loadFraction(signals) >= 1;
        if (elapsed < timing.reducedMin || (!loaded && elapsed < timing.reducedCap)) return;
        if (tick) gsap.ticker.remove(tick);
        tick = null;
        context.add(() => {
          gsap.to(root, { autoAlpha: 0, duration: timing.reducedFade, ease: "none", onComplete: finish });
        });
      };
      gsap.ticker.add(tick);
      return;
    }

    const { speed } = plan;
    const progress = { draw: 0 };
    let capped = false;
    let revealing = false;

    const drawn = gsap.timeline().timeScale(speed);
    drawn
      .fromTo(ink, { drawSVG: "0%" }, { drawSVG: "100%", duration: timing.draw, ease: EASE.draft }, 0)
      .to(progress, { draw: 1, duration: timing.draw, ease: EASE.draft }, 0);
    if (arrow) {
      drawn.fromTo(arrow, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.32, ease: EASE.out }, timing.draw * 0.7);
    }
    if (dot) {
      drawn.fromTo(
        dot,
        { scale: 0, transformOrigin: "50% 50%" },
        { scale: 1, transformOrigin: "50% 50%", duration: 0.32, ease: EASE.out },
        timing.draw * 0.8,
      );
    }
    // The dashes were measured at the screen scale of the draw; the window is about to be scaled, so drop them.
    drawn.call(() => {
      gsap.set(lines, { clearProps: "strokeDasharray,strokeDashoffset" });
    });

    const reveal = () => {
      revealing = true;
      if (tick) gsap.ticker.remove(tick);
      tick = null;
      digits.textContent = formatCounter(100);

      const rect = measureViewportRect(svg);
      const full = rect ? coverScale(points, origin, rect) : FALLBACK_FULL_SCALE;
      const grow = timing.revealHold + timing.holeDelay;

      // Created through `context.add` so that it belongs to the context even though it starts from a ticker callback.
      context.add(() => {
        gsap
          .timeline({ onComplete: finish })
          .timeScale(speed)
          .set(root, { pointerEvents: "none" }, 0)
          .to(counter, { opacity: 0, duration: 0.18, ease: "none" }, timing.revealHold)
          .to(plug, { opacity: 0, duration: timing.plugFade, ease: "none" }, timing.revealHold)
          .to(group, { scale: full, svgOrigin: `${origin[0]} ${origin[1]}`, duration: timing.hole, ease: EASE.inOut }, grow)
          .to(accents, { opacity: 0, duration: 0.3, ease: "none" }, grow + timing.hole * 0.3)
          .to(root, { autoAlpha: 0, duration: timing.rootFade, ease: "none" }, grow + timing.hole);
      });
    };

    tick = () => {
      const real = loadFraction(signals);
      digits.textContent = formatCounter(displayedPercent(real, progress.draw));
      if (!revealing && canReveal(progress.draw, real, capped)) reveal();
    };
    gsap.ticker.add(tick);
    gsap.delayedCall(timing.loadCap / speed, () => {
      capped = true;
    });
  }, root);

  return () => {
    if (tick) gsap.ticker.remove(tick);
    tick = null;
    context.revert();
  };
}

export function BoundaryLoader({
  boundary,
  roundabout,
  entry,
  viewBox,
  heroSelector = DEFAULT_HERO_SELECTOR,
  onDone,
  persist = true,
  forceStatic = false,
}: BoundaryLoaderProps) {
  const { ready, tier, reducedMotion } = useDeviceTier();
  const staticRun = forceStatic || tier === "C" || reducedMotion;

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const plugRef = useRef<SVGPathElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const geometry = useMemo(() => {
    if (boundary.length < 3) return null;
    const points = boundary as readonly Point[];
    const bounds = polygonBounds(points);
    const arrowSize = Math.max(bounds.width, bounds.height) * ARROW_SIZE_RATIO;
    const arrow = entry ? entryArrow(entry, polygonCentroid(points), arrowSize) : null;
    const extent = arrow ? unionBounds(bounds, polygonBounds(arrow.points)) : bounds;
    return {
      points,
      origin: [bounds.centerX, bounds.centerY] as Point,
      viewBox: (viewBox ?? paddedViewBox(extent, 0.1)).map((value) => Math.round(value * 100) / 100).join(" "),
      polygonD: polygonToPath(points),
      sheetD: sheetWithHolePath(outerRect(bounds, 8), points),
      arrowD: arrow?.path ?? null,
    };
  }, [boundary, entry, viewBox]);

  useEffect(() => {
    if (!ready || !geometry) return;
    const root = rootRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    const plug = plugRef.current;
    const guide = guideRef.current;
    const ink = inkRef.current;
    const counter = counterRef.current;
    const digits = digitsRef.current;
    if (!root || !svg || !group || !plug || !guide || !ink || !counter || !digits) return;
    const parts: LoaderParts = { root, svg, group, plug, guide, ink, arrow: arrowRef.current, dot: dotRef.current, counter, digits };

    let disposed = false;
    const timers: number[] = [];
    const finish = () => {
      if (disposed) return;
      root.dataset.state = "done";
      if (persist) writeSeen();
      onDoneRef.current?.();
    };

    // Skip: seen this session, arrived by navigating, or JavaScript took so long that CSS has already given up.
    if (persist && (readSeen() || hasNavigatedClientSide() || performance.now() > LOADER_TIMING.failsafeMs)) {
      root.dataset.state = "done";
      writeSeen();
      // After the effect, so a parent that sets state in onDone does not do it synchronously inside this effect.
      queueMicrotask(() => {
        if (!disposed) onDoneRef.current?.();
      });
      return () => {
        disposed = true;
      };
    }

    root.dataset.state = "running";
    root.dataset.mode = staticRun ? "static" : "animated";

    const signals: LoadSignals = { fonts: false, hero: false, page: false };
    const stopTracking = trackLoading(heroSelector, (signal) => {
      signals[signal] = true;
    });

    const mountedAt = performance.now();
    let teardown: (() => void) | undefined;
    let leaving = false;

    // No runtime (offline, blocked chunk): leave with a plain CSS fade rather than hold the page.
    const leaveWithoutMotion = () => {
      if (disposed || leaving || teardown) return;
      leaving = true;
      root.dataset.mode = "static";
      root.style.transition = "opacity 0.35s linear";
      root.style.opacity = "0";
      timers.push(window.setTimeout(finish, FALLBACK_EXIT_MS));
    };
    timers.push(window.setTimeout(leaveWithoutMotion, RUNTIME_WAIT_MS));

    loadMotion().then(
      (runtime) => {
        if (disposed || leaving) return;
        const plan: LoaderPlan = staticRun ? { mode: "static" } : planForLateness((performance.now() - mountedAt) / 1000);
        root.dataset.mode = plan.mode;
        teardown = play({ runtime, plan, parts, signals, points: geometry.points, origin: geometry.origin, finish });
      },
      leaveWithoutMotion,
    );

    return () => {
      disposed = true;
      timers.forEach((id) => window.clearTimeout(id));
      stopTracking();
      teardown?.();
      root.style.removeProperty("transition");
      root.style.removeProperty("opacity");
      root.dataset.state = "idle";
      delete root.dataset.mode;
      digits.textContent = formatCounter(0);
    };
  }, [ready, geometry, staticRun, heroSelector, persist]);

  if (!geometry) return null;

  return (
    <div ref={rootRef} className="pi-loader" data-state="idle" aria-hidden="true">
      <svg
        ref={svgRef}
        className="pi-loader__svg"
        viewBox={geometry.viewBox}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        <g ref={groupRef}>
          <path className="pi-loader__sheet" fillRule="evenodd" d={geometry.sheetD} />
          <path ref={plugRef} className="pi-loader__plug" d={geometry.polygonD} />
          <path ref={guideRef} className="pi-loader__guide" d={geometry.polygonD} />
          <path ref={inkRef} className="pi-loader__ink" d={geometry.polygonD} />
          {geometry.arrowD ? <path ref={arrowRef} className="pi-loader__ink" d={geometry.arrowD} /> : null}
          {roundabout ? (
            <circle
              ref={dotRef}
              className="pi-loader__dot"
              cx={roundabout.center[0]}
              cy={roundabout.center[1]}
              r={roundabout.radius}
            />
          ) : null}
        </g>
      </svg>
      <p ref={counterRef} className="pi-loader__counter">
        <span ref={digitsRef}>{formatCounter(0)}</span>
        <span>%</span>
      </p>
    </div>
  );
}
