/**
 * Sizes and timings of the S8 cursor. Owner: motion-lead.
 *
 * Pure numbers, so they are unit-tested. The cursor is never drawn small and scaled up (that stretches a rasterised
 * bitmap and blurs every edge): the ring, core and disc are real boxes whose size is the animated value. All sizes are
 * even whole pixels so a box centred on the pointer (left = -size / 2) always lands on the device pixel grid.
 */
import type { CursorState } from "./cursor-state";

export interface CursorGeometry {
  /** Diameter in CSS px of each part; 0 means the part is not drawn. */
  ring: number;
  core: number;
  disc: number;
  ringOpacity: number;
  coreOpacity: number;
  labelOpacity: number;
}

const RING_REST = 30;
const RING_GROW = 64;
const CORE_REST = 6;
const DISC = 88;

const RING_REST_PRESSED = 26;
const RING_GROW_PRESSED = 56;
const CORE_PRESSED = 4;
const DISC_PRESSED = 80;

/** Hairline ring with a solid core at rest; a larger thin ring over links; the labelled disc over `data-cursor-label`. */
export function geometryFor(state: CursorState, pressed: boolean): CursorGeometry {
  if (state.kind === "grow") {
    return { ring: pressed ? RING_GROW_PRESSED : RING_GROW, core: CORE_REST, disc: 0, ringOpacity: 1, coreOpacity: 0, labelOpacity: 0 };
  }
  if (state.kind === "label") {
    return { ring: RING_REST, core: CORE_REST, disc: pressed ? DISC_PRESSED : DISC, ringOpacity: 0, coreOpacity: 0, labelOpacity: 1 };
  }
  // "default", and "native" (hidden as a whole by the caller, so the shape only matters when it comes back).
  return {
    ring: pressed ? RING_REST_PRESSED : RING_REST,
    core: pressed ? CORE_PRESSED : CORE_REST,
    disc: 0,
    ringOpacity: 1,
    coreOpacity: 1,
    labelOpacity: 0,
  };
}

export interface MotionProfile {
  reduced: boolean;
  /** Seconds each layer takes to catch up with the pointer. The core is near-instant, the ring and disc trail it. */
  coreFollow: number;
  ringFollow: number;
  discFollow: number;
  /** Seconds for a part to change size. `grow` has a soft spring, `settle` a plain deceleration, `press` is quick. */
  grow: number;
  settle: number;
  press: number;
  growEase: string;
  settleEase: string;
}

const STILL = { coreFollow: 0, ringFollow: 0, discFollow: 0, grow: 0, settle: 0, press: 0 } as const;

/** Reduced motion: the cursor sits on the pointer and changes shape without easing, springs or lag. */
export function motionProfile(reduced: boolean): MotionProfile {
  if (reduced) return { reduced, ...STILL, growEase: "none", settleEase: "none" };
  return {
    reduced,
    coreFollow: 0.08,
    ringFollow: 0.28,
    discFollow: 0.34,
    grow: 0.9,
    settle: 0.45,
    press: 0.18,
    // One gentle overshoot (about 9%) and out: elastic in feel, never wobbly.
    growEase: "elastic.out(1, 0.8)",
    settleEase: "power3.out",
  };
}

/** Round a CSS px position to a whole device pixel, so a layer never sits between two pixels (which softens it). */
export function snapToDevicePixel(value: number, devicePixelRatio: number): number {
  const ratio = devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.round(value * ratio) / ratio;
}
