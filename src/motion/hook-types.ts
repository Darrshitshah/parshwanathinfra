/**
 * Option types shared by the scroll hooks and the effects behind them. Owner: motion-lead.
 * Types only (erased at build time), so importing this file never pulls GSAP in.
 */
import type { SplitUnit } from "./types";

export interface RevealHookOptions {
  /** ScrollTrigger start, default "top 85%". */
  start?: string;
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  duration?: number;
}

export interface SplitRevealHookOptions extends RevealHookOptions {
  by?: SplitUnit;
  stagger?: number;
}

export interface InkDrawHookOptions extends RevealHookOptions {
  stagger?: number;
}

export interface DimensionCountHookOptions extends RevealHookOptions {
  format?: (value: number) => string;
  decimals?: number;
}

export interface StripBlindsHookOptions extends RevealHookOptions {
  /** Strips per element. Default 12 on Tier A, 6 on Tier B. */
  strips?: number;
  orientation?: "vertical" | "horizontal";
}

export interface BoulevardWipeHookOptions extends RevealHookOptions {
  direction?: "ltr" | "rtl";
  mode?: "line" | "reveal";
}

export interface FadeRevealHookOptions extends RevealHookOptions {
  /** Pixels the element rises from (transform only). Default 24. */
  y?: number;
}
