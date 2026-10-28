/**
 * GSAP wiring of the S8 cursor. Owner: motion-lead.
 *
 * Sizes are CSS custom properties (`--pi-size`, `--pi-disc`) that cursor.css turns into real width, height and offset, so
 * every size is re-drawn by the browser at the device resolution instead of a small bitmap being stretched. The layers
 * are `position: fixed` with no size, so animating them never reflows the page.
 */
import { gsap } from "gsap";
import { snapToDevicePixel, type CursorGeometry, type MotionProfile } from "./cursor-geometry";

export interface CursorParts {
  ringLayer: HTMLElement;
  coreLayer: HTMLElement;
  discLayer: HTMLElement;
  ring: HTMLElement;
  core: HTMLElement;
  disc: HTMLElement;
  label: HTMLElement;
}

/** What changed: a new state over a new element, a press or release, or a jump with no animation. */
export type MorphKind = "state" | "press" | "instant";

const LABEL_RISE_PX = 4;
const LABEL_DELAY_SECONDS = 0.12;
const FADE_SECONDS = 0.2;

export function readParts(root: HTMLElement | null): CursorParts | null {
  if (!root) return null;
  const find = (selector: string) => root.querySelector<HTMLElement>(selector);
  const parts = {
    ringLayer: find(".pi-cursor--ring"),
    coreLayer: find(".pi-cursor--core"),
    discLayer: find(".pi-cursor--disc"),
    ring: find(".pi-cursor__ring"),
    core: find(".pi-cursor__core"),
    disc: find(".pi-cursor__disc"),
    label: find(".pi-cursor__label"),
  };
  const { ringLayer, coreLayer, discLayer, ring, core, disc, label } = parts;
  if (!ringLayer || !coreLayer || !discLayer || !ring || !core || !disc || !label) return null;
  return { ringLayer, coreLayer, discLayer, ring, core, disc, label };
}

export const layersOf = (parts: CursorParts): HTMLElement[] => [parts.ringLayer, parts.coreLayer, parts.discLayer];

const px = (value: number): string => `${value}px`;
const snap = (value: number): number => snapToDevicePixel(value, window.devicePixelRatio);

/** Park the layers off screen and draw the first shape without animation. */
export function initParts(parts: CursorParts, geometry: CursorGeometry): void {
  gsap.set(layersOf(parts), { opacity: 0 });
  paint(parts, geometry);
}

function paint(parts: CursorParts, geometry: CursorGeometry): void {
  gsap.set(parts.ring, { "--pi-size": px(geometry.ring), opacity: geometry.ringOpacity });
  gsap.set(parts.core, { "--pi-size": px(geometry.core), opacity: geometry.coreOpacity });
  gsap.set(parts.disc, { "--pi-disc": px(geometry.disc), opacity: geometry.disc > 0 ? 1 : 0 });
  gsap.set(parts.label, { opacity: geometry.labelOpacity, y: geometry.labelOpacity > 0 ? 0 : LABEL_RISE_PX });
}

/** One layer that glides toward a target, trailing it by about `seconds`, and always lands on whole device pixels. */
export interface Follower {
  moveTo: (x: number, y: number) => void;
  jumpTo: (x: number, y: number) => void;
  stop: () => void;
}

/** Exponential smoothing: frame-rate independent, and `seconds` is roughly the time to cover 95% of the distance. */
const SETTLE_TIME_CONSTANTS = 3;
const REST_DISTANCE_PX = 0.01;

function follower(layer: HTMLElement, seconds: number): Follower {
  let x = -100;
  let y = -100;
  let targetX = x;
  let targetY = y;
  let running = false;
  const draw = () => {
    layer.style.transform = `translate(${snap(x)}px, ${snap(y)}px)`;
  };
  const stop = () => {
    gsap.ticker.remove(step);
    running = false;
  };
  function step(_time: number, deltaMs: number) {
    const k = 1 - Math.exp(-(deltaMs / 1000) / (seconds / SETTLE_TIME_CONSTANTS));
    x += (targetX - x) * k;
    y += (targetY - y) * k;
    if (Math.abs(targetX - x) < REST_DISTANCE_PX && Math.abs(targetY - y) < REST_DISTANCE_PX) {
      x = targetX;
      y = targetY;
      stop();
    }
    draw();
  }
  const jumpTo = (nextX: number, nextY: number) => {
    stop();
    x = targetX = nextX;
    y = targetY = nextY;
    draw();
  };
  const moveTo = (nextX: number, nextY: number) => {
    if (seconds <= 0) return jumpTo(nextX, nextY);
    targetX = nextX;
    targetY = nextY;
    if (running) return;
    running = true;
    gsap.ticker.add(step);
  };
  draw();
  return { moveTo, jumpTo, stop };
}

/** The core is near-instant; the ring and the disc trail it by different amounts. */
export function createFollowers(parts: CursorParts, motion: MotionProfile): Follower {
  const all = [
    follower(parts.coreLayer, motion.coreFollow),
    follower(parts.ringLayer, motion.ringFollow),
    follower(parts.discLayer, motion.discFollow),
  ];
  const each = (run: (item: Follower) => void) => all.forEach(run);
  return {
    moveTo: (x, y) => each((item) => item.moveTo(x, y)),
    jumpTo: (x, y) => each((item) => item.jumpTo(x, y)),
    stop: () => each((item) => item.stop()),
  };
}

export function setVisible(parts: CursorParts, visible: boolean, animate: boolean): void {
  gsap.to(layersOf(parts), { opacity: visible ? 1 : 0, duration: animate ? FADE_SECONDS : 0, ease: "none", overwrite: "auto" });
}

/** Animate from one geometry to the next. Growing springs, shrinking and pressing settle. */
export function morph(parts: CursorParts, from: CursorGeometry, to: CursorGeometry, motion: MotionProfile, kind: MorphKind): void {
  if (kind === "instant" || motion.reduced) {
    paint(parts, to);
    return;
  }
  const seconds = (growing: boolean) => (kind === "press" ? motion.press : growing ? motion.grow : motion.settle);
  const ease = (growing: boolean) => (kind === "press" ? motion.settleEase : growing ? motion.growEase : motion.settleEase);
  const size = (target: HTMLElement, name: string, a: number, b: number, opacity: number) => {
    const growing = b > a;
    gsap.to(target, { [name]: px(b), duration: seconds(growing), ease: ease(growing), overwrite: "auto" });
    gsap.to(target, { opacity, duration: FADE_SECONDS, ease: "power2.out", overwrite: "auto" });
  };

  size(parts.ring, "--pi-size", from.ring, to.ring, to.ringOpacity);
  size(parts.core, "--pi-size", from.core, to.core, to.coreOpacity);
  size(parts.disc, "--pi-disc", from.disc, to.disc, to.disc > 0 ? 1 : 0);

  const showing = to.labelOpacity > 0;
  const labelDone = kind === "press" || (showing && from.labelOpacity > 0);
  gsap.to(parts.label, {
    opacity: to.labelOpacity,
    y: showing ? 0 : LABEL_RISE_PX,
    duration: showing ? (labelDone ? 0 : 0.4) : 0.12,
    delay: showing && !labelDone ? LABEL_DELAY_SECONDS : 0,
    ease: "power3.out",
    overwrite: "auto",
  });
}

export function killParts(parts: CursorParts): void {
  gsap.killTweensOf([...layersOf(parts), parts.ring, parts.core, parts.disc, parts.label]);
}
