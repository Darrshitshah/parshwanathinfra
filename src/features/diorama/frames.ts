/**
 * The pre-rendered scroll sequence (Tier B) and the stills (Tier C). Owner: scene-lead.
 * Frames are tools/blender/render_stills.py sequence output: frame-001 .. frame-066, 1280 px wide, same timeline as the WebGL camera.
 */
export const FRAME_COUNT = 66;
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 704;
export const STILL_WIDTH = 1920;
export const STILL_HEIGHT = 1056;
const FRAME_BASE = "/sequences/diorama";
const STILL_BASE = "/3d/stills";
export const MODEL_URL = "/3d/shiv-shiva.glb";

export function frameUrl(index: number): string {
  const n = Math.min(FRAME_COUNT, Math.max(1, Math.round(index)));
  return `${FRAME_BASE}/frame-${String(n).padStart(3, "0")}.webp`;
}

export function stillUrl(stationId: string): string {
  return `${STILL_BASE}/${stationId}.webp`;
}

export const frameUrls = (): string[] => Array.from({ length: FRAME_COUNT }, (_, i) => frameUrl(i + 1));

/** Zero-based frame index for scroll progress 0..1. */
export function frameIndexAt(progress: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * (FRAME_COUNT - 1));
}

/** Nearest already-loaded frame to `wanted` (zero-based), or -1 when nothing is loaded yet. */
export function nearestLoaded(wanted: number, loaded: ReadonlySet<number>): number {
  if (loaded.has(wanted)) return wanted;
  for (let d = 1; d < FRAME_COUNT; d += 1) {
    if (loaded.has(wanted - d)) return wanted - d;
    if (loaded.has(wanted + d)) return wanted + d;
  }
  return -1;
}
