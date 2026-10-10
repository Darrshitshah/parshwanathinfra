/**
 * inkDraw: strokes draw like ink on paper (DrawSVG). Owner: motion-lead.
 */
import { gsap } from "gsap";
import { DURATION, EASE } from "../constants";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Targets, Timeline } from "../types";
import { drawableShapes } from "./shared";

export interface InkDrawOptions extends PrimitiveOptions {
  /** Seconds between the start of each shape (default 0.08). */
  stagger?: number;
}

/**
 * Draw SVG strokes like ink on paper. Used by the loader, the plan draw-in and dimension lines.
 *
 * `targets` can be shapes (path, line, polyline, polygon, rect, circle, ellipse) or any group, svg or wrapper that
 * contains them. Shapes need a visible stroke. Add `data-ink-skip` to a shape to leave it out.
 * Reduced: the strokes are shown complete with a quick fade; nothing is drawn.
 */
export function inkDraw(targets: Targets, options: InkDrawOptions = {}): Timeline {
  registerMotion();
  const {
    reduced = false,
    duration = DURATION.draw,
    delay = 0,
    ease = EASE.draft,
    paused = false,
    stagger = 0.08,
  } = options;
  const timeline = gsap.timeline({ paused, delay });
  const shapes = drawableShapes(targets);
  if (shapes.length === 0) return timeline;

  if (reduced) {
    timeline
      .set(shapes, { clearProps: "strokeDasharray,strokeDashoffset" })
      .fromTo(shapes, { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none" });
    return timeline;
  }

  timeline.fromTo(shapes, { drawSVG: "0%" }, { drawSVG: "100%", duration, ease, stagger });
  return timeline;
}
