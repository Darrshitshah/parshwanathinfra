/**
 * stripBlinds: staggered "blinds" cut from the row-house strips, for galleries. Owner: motion-lead.
 */
import { gsap } from "gsap";
import { DURATION, EASE } from "../constants";
import { blindsClipPath } from "../geometry";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Timeline } from "../types";
import { isHtmlElement } from "./shared";

export interface StripBlindsOptions extends PrimitiveOptions {
  /** Number of strips per element (default 12; use about 6 on Tier B). */
  strips?: number;
  /** Seconds between strips (default 0.05). */
  stagger?: number;
  /** "vertical" slats side by side across the width (default), or "horizontal" bands stacked down the height. */
  orientation?: "vertical" | "horizontal";
  /** Seconds between elements when several are passed (default 0.12). */
  itemDelay?: number;
}

const DEFAULT_STRIPS = 12;
const STRIP_DURATION = 0.7;

/**
 * Staggered "blinds" reveal cut from the row-house strips, for galleries.
 *
 * Each element is covered by `strips` slats of its own picture; every slat opens from its centre line, one after
 * the other, until the picture is whole. It animates a CSS clip-path on the element itself, so there are no overlay
 * elements and the surface behind the picture can be any colour. The clip is removed when the reveal ends.
 * Reduced: a quick staggered fade.
 * If you kill the timeline early, clear `element.style.clipPath` yourself (the hooks do).
 */
export function stripBlinds(targets: HTMLElement | HTMLElement[], options: StripBlindsOptions = {}): Timeline {
  registerMotion();
  const {
    reduced = false,
    strips = DEFAULT_STRIPS,
    stagger = 0.05,
    orientation = "vertical",
    itemDelay = 0.12,
    delay = 0,
    paused = false,
    ease = EASE.draft,
    duration = STRIP_DURATION,
  } = options;
  const elements = (Array.isArray(targets) ? targets : [targets]).filter(isHtmlElement);
  const timeline = gsap.timeline({ paused, delay });
  if (elements.length === 0) return timeline;

  if (reduced) {
    timeline.fromTo(elements, { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none", stagger: 0.06 });
    return timeline;
  }

  const count = Math.max(2, Math.round(strips));
  elements.forEach((element, index) => {
    const openness = Array.from({ length: count }, () => ({ value: 0 }));
    const paint = () => {
      element.style.clipPath = blindsClipPath(
        element.offsetWidth,
        element.offsetHeight,
        openness.map((strip) => strip.value),
        orientation,
      );
    };
    paint();
    timeline.to(
      openness,
      {
        value: 1,
        duration,
        ease,
        stagger: { each: stagger, from: "start" },
        onUpdate: paint,
        onComplete: () => {
          element.style.clipPath = "";
        },
      },
      index * itemDelay,
    );
  });
  return timeline;
}
