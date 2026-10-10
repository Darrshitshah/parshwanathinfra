/**
 * Tiny pure helpers shared by the primitives and the geometry code. Owner: motion-lead.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Geometric interpolation between two positive numbers. Scales feel even when they change by a constant
 * ratio per frame, so the iris curtain uses this instead of `lerp` (no dead time while a huge hole shrinks).
 */
export function lerpLog(from: number, to: number, t: number): number {
  const safeFrom = Math.max(from, Number.EPSILON);
  const safeTo = Math.max(to, Number.EPSILON);
  return safeFrom * Math.pow(safeTo / safeFrom, clamp01(t));
}
