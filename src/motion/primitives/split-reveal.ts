/**
 * splitReveal: lines, words or characters rise out of a mask (SplitText). Owner: motion-lead.
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { DURATION, EASE } from "../constants";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, SplitUnit, Timeline } from "../types";

export type { SplitUnit };

export interface SplitRevealOptions extends PrimitiveOptions {
  by?: SplitUnit;
  /** Seconds between units. Defaults depend on `by`. */
  stagger?: number;
  /** Put the original markup back once the reveal has played (recommended for one-shot reveals). */
  revertOnComplete?: boolean;
  /** Start offset as a percentage of each unit's height (default 110, so a unit starts fully inside its mask). */
  from?: number;
}

const DEFAULTS: Record<SplitUnit, { duration: number; stagger: number }> = {
  lines: { duration: 1, stagger: 0.1 },
  words: { duration: 0.8, stagger: 0.05 },
  chars: { duration: 0.6, stagger: 0.02 },
};

const SPLIT_TYPE: Record<SplitUnit, string> = {
  lines: "lines",
  words: "lines,words",
  chars: "lines,words,chars",
};

/**
 * Split text into lines or words and reveal them from a mask. Call `revert` on cleanup.
 *
 * Lines are always masked, so words and characters also rise out of their line. The split re-runs by itself when
 * fonts finish loading or the width changes (SplitText `autoSplit`), so line breaks stay right.
 * Reduced: a quick fade of the whole element, no split.
 */
export function splitReveal(
  target: Element,
  options: SplitRevealOptions = {},
): { timeline: Timeline; revert: () => void } {
  registerMotion();
  const { reduced = false, by = "lines", paused = false, delay = 0, revertOnComplete = false, from = 110 } = options;
  const defaults = DEFAULTS[by];
  const duration = options.duration ?? defaults.duration;
  const stagger = options.stagger ?? defaults.stagger;
  const ease = options.ease ?? EASE.expo;
  const timeline = gsap.timeline({ paused, delay });

  if (reduced) {
    timeline.fromTo(target, { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none" });
    return {
      timeline,
      revert: () => {
        timeline.kill();
        gsap.set(target, { clearProps: "opacity" });
      },
    };
  }

  const unitsOf = (split: SplitText): Element[] =>
    by === "lines" ? split.lines : by === "words" ? split.words : split.chars;

  const split = SplitText.create(target, {
    type: SPLIT_TYPE[by],
    mask: "lines",
    // SplitText names each mask "<class>-mask"; motion.css gives `.pi-line-mask` room for descenders.
    linesClass: "pi-line",
    autoSplit: true,
    // SplitText records this tween, reverts it before a re-split and restores its progress afterwards.
    onSplit: (self) => {
      const tween = gsap.from(unitsOf(self), { yPercent: from, duration, ease, stagger });
      timeline.add(tween, 0);
      return tween;
    },
  });

  if (revertOnComplete) timeline.eventCallback("onComplete", () => split.revert());

  return {
    timeline,
    revert: () => {
      timeline.kill();
      split.revert();
    },
  };
}
