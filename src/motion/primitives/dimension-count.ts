/**
 * dimensionCount: a dimension line with end ticks draws, then the value counts up inside it. Owner: motion-lead.
 */
import { gsap } from "gsap";
import { EASE, DURATION } from "../constants";
import { createNumberFormatter } from "../format";
import { registerMotion } from "../setup";
import type { PrimitiveOptions, Timeline } from "../types";

export interface DimensionCountOptions extends PrimitiveOptions {
  value: number;
  /** Custom text for a value. Defaults to Indian grouping (1,565 and 12,50,000) via Intl.NumberFormat("en-IN"). */
  format?: (value: number) => string;
  /** Decimal places for the default formatter (default 0). */
  decimals?: number;
}

export interface DimensionElements {
  line: SVGGeometryElement;
  /** End ticks first and last; extra ticks appear as the line reaches them. */
  ticks?: SVGGeometryElement[];
  output: HTMLElement;
}

const TICK_IN = 0.35;
const DEFAULT_DURATION = 1.4;

/**
 * Just the count: `output` counts from 0 to `value` and fades in. For stats that have no dimension line.
 * Same formatting and the same exact-at-the-end guarantee as `dimensionCount`.
 */
export function countTo(output: HTMLElement, options: DimensionCountOptions): Timeline {
  registerMotion();
  const { value, reduced = false, delay = 0, paused = false, duration = DEFAULT_DURATION, decimals = 0 } = options;
  const format = options.format ?? createNumberFormatter(decimals);
  const finalText = format(value);
  const timeline = gsap.timeline({ paused, delay });

  if (reduced) {
    output.textContent = finalText;
    timeline.fromTo(output, { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none" });
    return timeline;
  }

  output.textContent = format(0);
  const counter = { value: 0 };
  timeline
    .fromTo(output, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" }, 0)
    .to(
      counter,
      {
        value,
        duration,
        ease: EASE.out,
        snap: { value: 1 / 10 ** decimals },
        onUpdate: () => {
          output.textContent = format(counter.value);
        },
      },
      0,
    )
    .call(() => {
      output.textContent = finalText;
    });
  return timeline;
}

/**
 * A dimension line with end ticks draws, then the value counts up inside it.
 *
 * Sequence: first tick pops in, the line draws (DrawSVG) while the number counts, the last tick lands as the line
 * arrives. `output` gets the formatted value as its text; it is exact when the timeline ends. Interrupting the
 * timeline leaves an in-between number, so on cleanup call `timeline.progress(1)` or set the final text yourself.
 * Reduced: the final value is written at once and everything fades in.
 */
export function dimensionCount(elements: DimensionElements, options: DimensionCountOptions): Timeline {
  registerMotion();
  const { line, ticks = [], output } = elements;
  const {
    value,
    reduced = false,
    delay = 0,
    paused = false,
    duration = DEFAULT_DURATION,
    ease = EASE.draft,
    decimals = 0,
  } = options;
  const format = options.format ?? createNumberFormatter(decimals);
  const finalText = format(value);
  const timeline = gsap.timeline({ paused, delay });

  if (reduced) {
    output.textContent = finalText;
    timeline.fromTo([line, ...ticks, output], { opacity: 0 }, { opacity: 1, duration: DURATION.quick, ease: "none" });
    return timeline;
  }

  output.textContent = format(0);
  const counter = { value: 0 };
  const lineStart = TICK_IN * 0.6;

  ticks.forEach((tick, index) => {
    const at = index === 0 ? 0 : lineStart + (duration * index) / (ticks.length - 1) - TICK_IN * 0.5;
    timeline.fromTo(
      tick,
      { scaleY: 0, transformOrigin: "50% 50%" },
      { scaleY: 1, transformOrigin: "50% 50%", duration: TICK_IN, ease: EASE.out },
      Math.max(0, at),
    );
  });

  timeline
    .fromTo(line, { drawSVG: "0%" }, { drawSVG: "100%", duration, ease }, lineStart)
    .fromTo(output, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" }, lineStart)
    .to(
      counter,
      {
        value,
        duration,
        ease: EASE.out,
        snap: { value: 1 / 10 ** decimals },
        onUpdate: () => {
          output.textContent = format(counter.value);
        },
      },
      lineStart,
    )
    .call(() => {
      output.textContent = finalText;
    });

  return timeline;
}
