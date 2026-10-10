/**
 * roundaboutIris: a circular iris cut from the roundabout. Owner: motion-lead.
 */
import { gsap } from "gsap";
import { DURATION, EASE } from "../constants";
import { farthestCornerDistance } from "../geometry";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Timeline } from "../types";

export interface RoundaboutIrisOptions extends PrimitiveOptions {
  phase: "open" | "close";
  /** Viewport pixels (clientX / clientY). Defaults to the centre of the target. */
  origin?: { x: number; y: number };
}

const IRIS_DURATION = 0.9;

/**
 * Iris cut from the roundabout circle, opening or closing around an origin (viewport px).
 *
 * "open" grows a circle from the origin until the target is fully shown and then removes the clip;
 * "close" shrinks it to nothing and hides the target (visibility hidden), so it cannot be focused.
 * Reduced: a quick fade.
 */
export function roundaboutIris(target: HTMLElement, options: RoundaboutIrisOptions): Timeline {
  registerMotion();
  const { phase, reduced = false, paused = false, delay = 0, ease = EASE.inOut } = options;
  const timeline = gsap.timeline({ paused, delay });
  const opening = phase === "open";

  if (reduced) {
    return opening
      ? timeline.fromTo(target, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.quick, ease: "none" })
      : timeline.to(target, { autoAlpha: 0, duration: DURATION.quick, ease: "none" });
  }

  const box = target.getBoundingClientRect();
  const originX = (options.origin?.x ?? box.left + box.width / 2) - box.left;
  const originY = (options.origin?.y ?? box.top + box.height / 2) - box.top;
  const radius = Math.ceil(farthestCornerDistance(box.width, box.height, originX, originY)) + 2;
  const at = `${originX.toFixed(1)}px ${originY.toFixed(1)}px`;
  const closed = `circle(0px at ${at})`;
  const wide = `circle(${radius}px at ${at})`;
  const duration = options.duration ?? IRIS_DURATION;

  if (opening) {
    timeline
      .set(target, { visibility: "visible" }, 0)
      .fromTo(target, { clipPath: closed }, { clipPath: wide, duration, ease, clearProps: "clipPath" }, 0);
  } else {
    timeline
      .fromTo(target, { clipPath: wide }, { clipPath: closed, duration, ease }, 0)
      .set(target, { visibility: "hidden" });
  }
  return timeline;
}
