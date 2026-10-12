"use client";

/**
 * S1 brand intro: the red township boundary draws itself and opens into the hero. Owner: motion-lead.
 *
 * About one second in total, on every new visit (once per browser session). It is decorative, not a progress bar: it
 * never waits for fonts or images, and the hero paints underneath from the first frame (the overlay is an ordinary
 * fixed layer, so there is no layout shift and the LCP image is not delayed). The real site boundary draws in the
 * curtain red, the paper inside it fades so the page shows through a township-shaped window, and the window grows to
 * full bleed.
 *
 * Mount it once on Home, near the top of the page (it is position: fixed, so it never shifts layout):
 *   <BoundaryLoader {...shapeFromPlan(plan)} />        // from a server component: geometry arrives as props
 *
 * It renders in the server HTML so first paint is already covered, then hands over to JavaScript:
 *  - without JavaScript it never shows (loader.css only shows it under html[data-js="1"]);
 *  - with reduced motion it never shows (CSS); on Tier C it is a 200 ms fade;
 *  - after it has played once in a session (sessionStorage "pi-loader-seen"), or when the visitor arrived on this page
 *    by navigating (the curtain already covered the change), it never shows;
 *  - if JavaScript is slow to start, CSS fades it out by itself after 1.5 s; one that takes over late fades it;
 *  - the GSAP runtime loads in its own chunk after hydration; a late arrival speeds the animation up to stay inside
 *    1.2 s, and one that never arrives gets a plain fade out.
 * Geometry is props only: the plan is the single source of coordinates. Thin layer: no static GSAP import.
 */
import { useEffect, useMemo, useRef } from "react";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { EASE } from "@/motion/constants";
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
import { LATE_TAKEOVER_MS, LOADER_TIMING, planForLateness, RUNTIME_WAIT_MS, type LoaderPlan } from "./progress";

export const LOADER_SEEN_KEY = "pi-loader-seen";
/** The entry arrow is this fraction of the township's longest side. */
const ARROW_SIZE_RATIO = 0.05;
const FALLBACK_FULL_SCALE = 4;
const FADE_CLEANUP_PAD_MS = 40;

type PointLike = readonly [number, number];

export interface BoundaryLoaderProps {
  /** The site boundary on the render grid (plan.boundary). */
  boundary: readonly PointLike[];
  /** The roundabout: drawn as a curtain-red dot (plan.roundabout). */
  roundabout?: { center: PointLike; radius: number };
  /** The main entry: drawn as an arrow pointing into the township (the "main" entry of plan.entries). */
  entry?: PointLike;
  /** SVG viewBox. Default: the boundary and arrow with a 10% margin. */
  viewBox?: readonly [number, number, number, number];
  /** Called once when the loader has finished, or (just after mount) when it is skipped. */
  onDone?: () => void;
  /** Review tools only: do not read or write the session flag, so the loader can be replayed. Default true. */
  persist?: boolean;
  /** Review tools only: play the Tier C version (a 200 ms fade) on any tier and ignore reduced motion CSS. */
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
  ink: SVGPathElement;
  arrow: SVGPathElement | null;
  dot: SVGCircleElement | null;
}

interface PlayInput {
  runtime: MotionRuntime;
  plan: Extract<LoaderPlan, { mode: "animated" }>;
  parts: LoaderParts;
  points: readonly Point[];
  origin: Point;
  finish: () => void;
}

/** The GSAP part: one timeline in one context, so the returned cleanup stops all of it. */
function play({ runtime, plan, parts, points, origin, finish }: PlayInput): () => void {
  const { gsap } = runtime;
  const { root, svg, group, plug, ink, arrow, dot } = parts;
  const timing = LOADER_TIMING;
  const lines = present<SVGPathElement>(ink, arrow);
  const accents = present<SVGElement>(ink, arrow, dot);

  const context = gsap.context(() => {
    gsap.set([...lines, dot], { opacity: 1 });

    const rect = measureViewportRect(svg);
    const full = rect ? coverScale(points, origin, rect) : FALLBACK_FULL_SCALE;

    const line = gsap.timeline({ onComplete: finish }).timeScale(plan.speed);
    line.fromTo(ink, { drawSVG: "0%" }, { drawSVG: "100%", duration: timing.draw, ease: EASE.draft }, 0);
    if (arrow) {
      line.fromTo(arrow, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.2, ease: EASE.out }, timing.draw * 0.6);
    }
    if (dot) {
      line.fromTo(
        dot,
        { scale: 0, transformOrigin: "50% 50%" },
        { scale: 1, transformOrigin: "50% 50%", duration: 0.25, ease: EASE.out },
        timing.draw * 0.5,
      );
    }
    line
      // The dashes were measured at the screen scale of the draw; the window is about to be scaled, so drop them.
      .call(() => {
        gsap.set(lines, { clearProps: "strokeDasharray,strokeDashoffset" });
      }, undefined, timing.draw)
      .set(root, { pointerEvents: "none" }, timing.plugAt)
      .to(plug, { opacity: 0, duration: timing.plugFade, ease: "none" }, timing.plugAt)
      .to(group, { scale: full, svgOrigin: `${origin[0]} ${origin[1]}`, duration: timing.hole, ease: EASE.inOut }, timing.holeAt)
      .to(accents, { opacity: 0, duration: timing.accentsFade, ease: "none" }, timing.accentsAt)
      .to(root, { autoAlpha: 0, duration: timing.rootFade, ease: "none" }, timing.rootFadeAt);
  }, root);

  return () => context.revert();
}

export function BoundaryLoader({
  boundary,
  roundabout,
  entry,
  viewBox,
  onDone,
  persist = true,
  forceStatic = false,
}: BoundaryLoaderProps) {
  const { ready, tier } = useDeviceTier();
  // Reduced motion never shows the loader at all (CSS), so here it only decides how a visible one leaves.
  const plainFade = forceStatic || tier === "C";

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const plugRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
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
    const ink = inkRef.current;
    if (!root || !svg || !group || !plug || !ink) return;
    const parts: LoaderParts = { root, svg, group, plug, ink, arrow: arrowRef.current, dot: dotRef.current };

    let disposed = false;
    const timers: number[] = [];
    const finish = () => {
      if (disposed) return;
      root.dataset.state = "done";
      if (persist) writeSeen();
      onDoneRef.current?.();
    };

    // Skip: seen this session, or arrived by navigating (the curtain already covered the change).
    if (persist && (readSeen() || hasNavigatedClientSide())) {
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
    root.dataset.mode = "animated";

    let teardown: (() => void) | undefined;
    let leaving = false;

    // A plain CSS fade: Tier C, JavaScript that took over late, or a runtime that never arrived.
    const leaveWithFade = () => {
      if (disposed || leaving || teardown) return;
      leaving = true;
      root.dataset.mode = "static";
      root.style.pointerEvents = "none";
      root.style.transition = `opacity ${LOADER_TIMING.fallbackFade}s linear`;
      root.style.opacity = "0";
      timers.push(window.setTimeout(finish, LOADER_TIMING.fallbackFade * 1000 + FADE_CLEANUP_PAD_MS));
    };

    if (plainFade || performance.now() > LATE_TAKEOVER_MS) {
      // Next frame, so the transition has a starting opacity to run from.
      timers.push(window.setTimeout(leaveWithFade, 0));
    } else {
      const mountedAt = performance.now();
      timers.push(window.setTimeout(leaveWithFade, RUNTIME_WAIT_MS));
      loadMotion().then(
        (runtime) => {
          if (disposed || leaving) return;
          const plan: LoaderPlan = planForLateness((performance.now() - mountedAt) / 1000);
          if (plan.mode === "static") {
            leaveWithFade();
            return;
          }
          teardown = play({ runtime, plan, parts, points: geometry.points, origin: geometry.origin, finish });
        },
        leaveWithFade,
      );
    }

    return () => {
      disposed = true;
      timers.forEach((id) => window.clearTimeout(id));
      teardown?.();
      root.style.removeProperty("transition");
      root.style.removeProperty("opacity");
      root.style.removeProperty("pointer-events");
      root.dataset.state = "idle";
      delete root.dataset.mode;
    };
  }, [ready, geometry, plainFade, persist]);

  if (!geometry) return null;

  return (
    <div ref={rootRef} className="pi-loader" data-state="idle" data-replay={persist ? undefined : ""} aria-hidden="true">
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
    </div>
  );
}
