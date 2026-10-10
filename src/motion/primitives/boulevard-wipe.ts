/**
 * boulevardWipe: the 40' boulevard as a horizontal wipe line between sections. Owner: motion-lead.
 */
import { gsap } from "gsap";
import { DURATION, EASE } from "../constants";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Timeline } from "../types";

export interface BoulevardWipeOptions extends PrimitiveOptions {
  direction?: "ltr" | "rtl";
  /**
   * "line": the target itself is the line and draws across (scaleX).
   * "reveal": the target holds `[data-wipe-line]` and/or `[data-wipe-content]`; the line draws and the content
   * is uncovered behind it with a clip.
   * Default: "reveal" when the target contains either marker, otherwise "line".
   */
  mode?: "line" | "reveal";
}

/**
 * Horizontal wipe line, the 40' boulevard, used between sections.
 *
 * Line mode needs a block-level element with a visible height (a 1px border, a dashed centre line, a rule).
 * Reduced: a quick fade of the same elements.
 */
export function boulevardWipe(target: HTMLElement, options: BoulevardWipeOptions = {}): Timeline {
  registerMotion();
  const { reduced = false, direction = "ltr", duration = DURATION.slow, ease = EASE.draft, delay = 0, paused = false } = options;
  const timeline = gsap.timeline({ paused, delay });
  const line = target.querySelector<HTMLElement>("[data-wipe-line]");
  const content = target.querySelector<HTMLElement>("[data-wipe-content]");
  const mode = options.mode ?? (line || content ? "reveal" : "line");

  if (reduced) {
    const faded = mode === "line" ? [target] : [line, content].filter((item): item is HTMLElement => item !== null);
    timeline.fromTo(faded, { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none" });
    return timeline;
  }

  const forward = direction === "ltr";
  const origin = forward ? "0% 50%" : "100% 50%";

  if (mode === "line") {
    timeline.fromTo(target, { scaleX: 0, transformOrigin: origin }, { scaleX: 1, transformOrigin: origin, duration, ease }, 0);
    return timeline;
  }

  if (line) {
    timeline.fromTo(line, { scaleX: 0, transformOrigin: origin }, { scaleX: 1, transformOrigin: origin, duration: duration * 0.8, ease }, 0);
  }
  if (content) {
    const hidden = forward ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
    timeline.fromTo(
      content,
      { clipPath: hidden },
      { clipPath: "inset(0% 0% 0% 0%)", duration, ease, clearProps: "clipPath" },
      line ? duration * 0.15 : 0,
    );
  }
  return timeline;
}
