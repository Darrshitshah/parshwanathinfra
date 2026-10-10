/**
 * boundaryCurtain: the page-transition curtain cut from the township boundary. Owner: motion-lead.
 *
 * Markup contract (rendered by `src/components/transition/Curtain.tsx`, any root element works):
 *   root                      fixed full-screen layer, hidden by default (visibility hidden, opacity 0)
 *   [data-curtain-panel]      full-screen brand-colour panel (the simple variant slides it)
 *   [data-curtain-label]      the next page's title, inside an overflow-clipped mask
 *   [data-curtain-eyebrow]    small mono line above the title
 *   [data-curtain-rule]       thin line under the title
 * The township-shaped variant needs a `HoleController` (see `src/motion/hole.ts`) for the SVG sheet path.
 */
import { gsap } from "gsap";
import { DURATION, EASE } from "../constants";
import type { HoleController } from "../hole";
import { lerpLog } from "../math";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Timeline } from "../types";
import { present } from "./shared";

export interface BoundaryCurtainOptions extends PrimitiveOptions {
  phase: "cover" | "reveal";
  /** The township-shaped hole. Without it the curtain falls back to the sliding panel. */
  hole?: HoleController | null;
  /** Force a variant. Default: "hole" when `hole` is given, else "panel". */
  variant?: "hole" | "panel";
  /** Scale at which the hole fills the screen. Measured from the SVG when omitted. */
  fullScale?: number;
  /** Cover phase: called the moment the old page is completely hidden (the right time to navigate). */
  onCovered?: () => void;
}

/** Seconds. Chosen so the whole round trip stays under about 1.5 s on desktop. */
export const CURTAIN_TIMING = {
  hole: { cover: 0.5, reveal: 0.7 },
  panel: { cover: 0.42, reveal: 0.5 },
  titleIn: 0.55,
  titleOut: 0.3,
} as const;

/** Where the hole stops shrinking before it snaps shut (a few pixels wide, so the snap is invisible). */
const HOLE_REST_SCALE = 0.012;

const SHOW = { autoAlpha: 1, pointerEvents: "auto" } as const;
const HIDE = { autoAlpha: 0, pointerEvents: "none" } as const;

interface CurtainParts {
  panel: HTMLElement | null;
  label: HTMLElement | null;
  eyebrow: HTMLElement | null;
  rule: HTMLElement | null;
}

function findParts(root: Element): CurtainParts {
  const query = (selector: string) => root.querySelector<HTMLElement>(selector);
  return {
    panel: query("[data-curtain-panel]"),
    label: query("[data-curtain-label]"),
    eyebrow: query("[data-curtain-eyebrow]"),
    rule: query("[data-curtain-rule]"),
  };
}

/**
 * Page curtain cut from the township boundary. "cover" closes the township-shaped window over the old page and
 * slides the next page's title through the brand-colour sheet; "reveal" slides the title out and opens the window
 * onto the new page. Reduced: the curtain fades in and out, no shape, no movement.
 */
export function boundaryCurtain(curtain: SVGElement | HTMLElement, options: BoundaryCurtainOptions): Timeline {
  registerMotion();
  const { phase, reduced = false, paused = false, delay = 0, onCovered } = options;
  const timeline = gsap.timeline({ paused, delay });
  const parts = findParts(curtain);
  const covering = phase === "cover";

  if (reduced) {
    if (covering) {
      timeline
        .set(curtain, { pointerEvents: "auto" }, 0)
        .fromTo(curtain, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "none" }, 0)
        .fromTo(present(parts.label, parts.eyebrow, parts.rule), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
        .call(() => onCovered?.());
    } else {
      timeline.to(curtain, { autoAlpha: 0, duration: 0.2, ease: "none" }).set(curtain, HIDE);
    }
    return timeline;
  }

  const hole = options.variant === "panel" ? null : (options.hole ?? null);
  return hole
    ? buildHoleCurtain(timeline, curtain, parts, hole, options)
    : buildPanelCurtain(timeline, curtain, parts, covering, onCovered);
}

function buildHoleCurtain(
  timeline: Timeline,
  curtain: SVGElement | HTMLElement,
  parts: CurtainParts,
  hole: HoleController,
  options: BoundaryCurtainOptions,
): Timeline {
  const full = options.fullScale ?? hole.measureCoverScale();
  const timing = CURTAIN_TIMING.hole;
  const progress = { t: 0 };

  if (options.phase === "cover") {
    hole.setScale(full);
    timeline.set(curtain, SHOW, 0).to(
      progress,
      {
        t: 1,
        duration: timing.cover,
        ease: EASE.inOut,
        onUpdate: () => hole.setScale(progress.t >= 1 ? 0 : lerpLog(full, HOLE_REST_SCALE, progress.t)),
      },
      0,
    );
    addTitleIn(timeline, parts, timing.cover * 0.55);
    timeline.call(() => options.onCovered?.(), undefined, timing.cover);
    return timeline;
  }

  hole.setScale(0);
  timeline.set(curtain, SHOW, 0);
  addTitleOut(timeline, parts);
  timeline
    .to(
      progress,
      {
        t: 1,
        duration: timing.reveal,
        ease: EASE.inOut,
        onUpdate: () => hole.setScale(lerpLog(HOLE_REST_SCALE, full, progress.t)),
      },
      0.12,
    )
    .set(curtain, HIDE);
  return timeline;
}

function buildPanelCurtain(
  timeline: Timeline,
  curtain: SVGElement | HTMLElement,
  parts: CurtainParts,
  covering: boolean,
  onCovered: (() => void) | undefined,
): Timeline {
  const timing = CURTAIN_TIMING.panel;
  if (covering) {
    timeline
      .set(curtain, SHOW, 0)
      .fromTo(parts.panel, { yPercent: 100 }, { yPercent: 0, duration: timing.cover, ease: EASE.draft }, 0)
      .call(() => onCovered?.(), undefined, timing.cover);
    addTitleIn(timeline, parts, timing.cover * 0.5);
    return timeline;
  }

  timeline.set(curtain, SHOW, 0);
  addTitleOut(timeline, parts);
  timeline
    .fromTo(parts.panel, { yPercent: 0 }, { yPercent: -100, duration: timing.reveal, ease: EASE.draft }, 0.1)
    .set(curtain, HIDE);
  return timeline;
}

function addTitleIn(timeline: Timeline, parts: CurtainParts, at: number): void {
  timeline
    .fromTo(parts.label, { yPercent: 115 }, { yPercent: 0, duration: CURTAIN_TIMING.titleIn, ease: EASE.expo }, at)
    .fromTo(
      parts.eyebrow,
      { opacity: 0, y: 10 },
      { opacity: 0.85, y: 0, duration: DURATION.base, ease: EASE.out },
      at + 0.05,
    )
    .fromTo(
      parts.rule,
      { scaleX: 0, transformOrigin: "0% 50%" },
      { scaleX: 1, transformOrigin: "0% 50%", duration: DURATION.base, ease: EASE.draft },
      at + 0.1,
    );
}

function addTitleOut(timeline: Timeline, parts: CurtainParts): void {
  timeline
    .to(parts.label, { yPercent: -115, duration: CURTAIN_TIMING.titleOut, ease: "power3.in" }, 0)
    .to(present(parts.eyebrow, parts.rule), { opacity: 0, duration: 0.25, ease: "none" }, 0);
}
