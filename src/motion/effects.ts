/**
 * The scroll-triggered effects behind the hooks in hooks.ts. Owner: motion-lead.
 *
 * Heavy layer: imports GSAP statically, so it is only ever loaded through `loadMotion()` (see load.ts).
 * Each function takes the element, builds its animation inside a `gsap.context` scoped to that element, and returns the
 * cleanup that reverts everything the context created (tweens, ScrollTriggers, SplitText, inline styles).
 * Every effect plays once when the element's top edge reaches `start` (default "top 85%").
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { REVEAL_START } from "./constants";
import { createNumberFormatter } from "./format";
import type {
  BoulevardWipeHookOptions,
  DimensionCountHookOptions,
  FadeRevealHookOptions,
  InkDrawHookOptions,
  SplitRevealHookOptions,
  StripBlindsHookOptions,
} from "./hook-types";
import { boulevardWipe } from "./primitives/boulevard-wipe";
import { countTo, dimensionCount } from "./primitives/dimension-count";
import { inkDraw } from "./primitives/ink-draw";
import { splitReveal } from "./primitives/split-reveal";
import { stripBlinds } from "./primitives/strip-blinds";
import { registerMotion } from "./setup";
import type { Timeline } from "./types";

interface Playable {
  play: () => unknown;
}

/** Plays a paused timeline or tween the first time `trigger` reaches `start`. The trigger lives in the active context. */
function playOnEnter(trigger: Element, animation: Playable, start: string): void {
  ScrollTrigger.create({
    trigger,
    start,
    once: true,
    onEnter: () => {
      animation.play();
    },
  });
}

/** Runs `build` in a context scoped to `scope`. Functions `build` returns are run when the context is reverted. */
function scoped(scope: Element, build: () => void | (() => void)): () => void {
  registerMotion();
  const context = gsap.context(build, scope);
  return () => context.revert();
}

export function revealSplit(element: HTMLElement, options: SplitRevealHookOptions = {}): () => void {
  const { by = "lines", start = REVEAL_START, stagger, duration, delay } = options;
  return scoped(element, () => {
    const { timeline, revert } = splitReveal(element, { by, paused: true, revertOnComplete: true, stagger, duration, delay });
    playOnEnter(element, timeline, start);
    return revert;
  });
}

export function revealInk(root: Element, options: InkDrawHookOptions = {}): () => void {
  const { start = REVEAL_START, stagger, duration, delay } = options;
  return scoped(root, () => {
    const timeline = inkDraw(root, { paused: true, stagger, duration, delay });
    playOnEnter(root, timeline, start);
  });
}

export function revealDimension(root: HTMLElement, value: number, options: DimensionCountHookOptions = {}): () => void {
  const { start = REVEAL_START, duration, delay, format, decimals = 0 } = options;
  const output = root.querySelector<HTMLElement>("[data-dim-output]");
  if (!output) return () => undefined;
  const formatValue = format ?? createNumberFormatter(decimals);
  const finalText = formatValue(value);

  return scoped(root, () => {
    const line = root.querySelector<SVGGeometryElement>("[data-dim-line]");
    const ticks = Array.from(root.querySelectorAll<SVGGeometryElement>("[data-dim-tick]"));
    const common = { value, paused: true, duration, delay, format: formatValue, decimals };
    const timeline = line ? dimensionCount({ line, ticks, output }, common) : countTo(output, common);
    playOnEnter(root, timeline, start);

    // Interrupted mid-count: leave the real number behind, not a half-counted one.
    return () => {
      output.textContent = finalText;
    };
  });
}

export function revealBlinds(root: HTMLElement, strips: number, options: StripBlindsHookOptions = {}): () => void {
  const { start = REVEAL_START, duration, delay, orientation = "vertical" } = options;
  return scoped(root, () => {
    const marked = Array.from(root.querySelectorAll<HTMLElement>("[data-blinds-item]"));
    const items = marked.length > 0 ? marked : [root];
    const timelines = new Map<Element, Timeline>(
      items.map((item) => [item, stripBlinds(item, { paused: true, strips, orientation, duration, delay })]),
    );
    ScrollTrigger.batch(items, {
      start,
      once: true,
      interval: 0.12,
      onEnter: (batch) => {
        batch.forEach((item, index) => timelines.get(item)?.delay((delay ?? 0) + index * 0.12).play());
      },
    });

    return () => {
      items.forEach((item) => {
        item.style.clipPath = "";
      });
    };
  });
}

export function revealWipe(element: HTMLElement, options: BoulevardWipeHookOptions = {}): () => void {
  const { start = REVEAL_START, duration, delay, direction = "ltr", mode } = options;
  return scoped(element, () => {
    const timeline = boulevardWipe(element, { paused: true, direction, mode, duration, delay });
    playOnEnter(element, timeline, start);
  });
}

export function revealFade(element: HTMLElement, options: FadeRevealHookOptions = {}): () => void {
  const { start = REVEAL_START, duration = 0.9, delay = 0, y = 24 } = options;
  return scoped(element, () => {
    const tween = gsap.fromTo(
      element,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration, delay, ease: "power3.out", paused: true, clearProps: "transform" },
    );
    playOnEnter(element, tween, start);
  });
}

/** Scroll parallax inside a frame: the element drifts `amount` percent of its own height each way, scaled up so edges never show. */
export function driftParallax(element: HTMLElement, amount: number): () => void {
  return scoped(element, () => {
    const trigger = element.parentElement ?? element;
    gsap.set(element, { scale: 1 + (amount * 2) / 100 + 0.02, transformOrigin: "50% 50%" });
    gsap.fromTo(
      element,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: "none",
        scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}
