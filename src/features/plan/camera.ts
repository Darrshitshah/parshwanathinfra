/**
 * Camera maths for the Living Plan stage. Pure and DOM free.
 *
 * The camera is a centre on the render grid plus a scale in CSS pixels per grid unit. The stage is an SVG with no
 * viewBox (user units are CSS pixels) and one inner group carrying `matrix(s 0 0 s tx ty)`, so panning and zooming
 * are transform only. Boxes (chapter views, bounds) are [x, y, w, h] on the grid and are fitted with "meet".
 */
export type Box = readonly [x: number, y: number, w: number, h: number];

export interface Size {
  w: number;
  h: number;
}

export interface Cam {
  cx: number;
  cy: number;
  /** CSS pixels per grid unit. */
  s: number;
}

export interface CamLimits {
  min: number;
  max: number;
}

export const MAX_ZOOM_RATIO = 10;
/** Fallback stage size before the first measurement (and in jsdom): the default 20:11 stage ratio. */
export const FALLBACK_SIZE: Size = { w: 1000, h: 550 };

export function boxCenter(box: Box): [number, number] {
  return [box[0] + box[2] / 2, box[1] + box[3] / 2];
}

/** The camera that shows `box` fully inside a stage of `size` ("meet"), optionally with a margin in pixels. */
export function fitBox(box: Box, size: Size, margin = 0): Cam {
  const [cx, cy] = boxCenter(box);
  const s = Math.min(Math.max(size.w - 2 * margin, 1) / box[2], Math.max(size.h - 2 * margin, 1) / box[3]);
  return { cx, cy, s };
}

export function camLimits(bounds: Box, size: Size): CamLimits {
  const min = fitBox(bounds, size).s;
  return { min, max: min * MAX_ZOOM_RATIO };
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/** Keep the scale inside the limits and the centre inside the bounds. */
export function clampCam(cam: Cam, bounds: Box, limits: CamLimits): Cam {
  return {
    s: clamp(cam.s, limits.min, limits.max),
    cx: clamp(cam.cx, bounds[0], bounds[0] + bounds[2]),
    cy: clamp(cam.cy, bounds[1], bounds[1] + bounds[3]),
  };
}

export interface CamTransform {
  tx: number;
  ty: number;
  s: number;
}

export function camTransform(cam: Cam, size: Size): CamTransform {
  return { s: cam.s, tx: size.w / 2 - cam.cx * cam.s, ty: size.h / 2 - cam.cy * cam.s };
}

export function transformAttr(cam: Cam, size: Size): string {
  const { s, tx, ty } = camTransform(cam, size);
  return `matrix(${round(s)} 0 0 ${round(s)} ${round(tx)} ${round(ty)})`;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

export function screenToGrid(cam: Cam, size: Size, px: number, py: number): [number, number] {
  const { tx, ty, s } = camTransform(cam, size);
  return [(px - tx) / s, (py - ty) / s];
}

export function gridToScreen(cam: Cam, size: Size, gx: number, gy: number): [number, number] {
  const { tx, ty, s } = camTransform(cam, size);
  return [gx * s + tx, gy * s + ty];
}

/** The part of the grid that is on screen. */
export function visibleBox(cam: Cam, size: Size): Box {
  const w = size.w / cam.s;
  const h = size.h / cam.s;
  return [cam.cx - w / 2, cam.cy - h / 2, w, h];
}

/** Zoom by `factor` keeping the grid point under the pixel (px, py) where it is. */
export function zoomAt(cam: Cam, size: Size, px: number, py: number, factor: number, bounds: Box, limits: CamLimits): Cam {
  const s = clamp(cam.s * factor, limits.min, limits.max);
  const [gx, gy] = screenToGrid(cam, size, px, py);
  return clampCam({ s, cx: gx - (px - size.w / 2) / s, cy: gy - (py - size.h / 2) / s }, bounds, limits);
}

/** Drag the plan by (dx, dy) pixels. */
export function panBy(cam: Cam, dx: number, dy: number, bounds: Box, limits: CamLimits): Cam {
  return clampCam({ s: cam.s, cx: cam.cx - dx / cam.s, cy: cam.cy - dy / cam.s }, bounds, limits);
}

/** How far in the camera is, 1 = the whole plan fits. */
export function zoomRatio(cam: Cam, limits: CamLimits): number {
  return cam.s / limits.min;
}

export type StageCommand =
  | { type: "pan"; dx: number; dy: number }
  | { type: "zoom"; factor: number }
  | { type: "reset" }
  | { type: "clear" }
  | { type: "digit"; digit: string };

export const KEY_PAN_PX = 72;
export const KEY_ZOOM_FACTOR = 1.35;

/** Keyboard on the focused stage: arrows pan, + and - zoom, 0 resets, 1 to 4 pick a typology, Escape clears. */
export function keyToCommand(key: string, modifiers: { ctrl?: boolean; meta?: boolean; alt?: boolean } = {}): StageCommand | null {
  if (modifiers.ctrl || modifiers.meta || modifiers.alt) return null;
  switch (key) {
    // The view moves in the arrow's direction, so the drawing slides the other way.
    case "ArrowLeft":
      return { type: "pan", dx: KEY_PAN_PX, dy: 0 };
    case "ArrowRight":
      return { type: "pan", dx: -KEY_PAN_PX, dy: 0 };
    case "ArrowUp":
      return { type: "pan", dx: 0, dy: KEY_PAN_PX };
    case "ArrowDown":
      return { type: "pan", dx: 0, dy: -KEY_PAN_PX };
    case "+":
    case "=":
      return { type: "zoom", factor: KEY_ZOOM_FACTOR };
    case "-":
    case "_":
      return { type: "zoom", factor: 1 / KEY_ZOOM_FACTOR };
    case "0":
      return { type: "reset" };
    case "Escape":
      return { type: "clear" };
    case "1":
    case "2":
    case "3":
    case "4":
      return { type: "digit", digit: key };
    default:
      return null;
  }
}

/** Blend two cameras: the centre moves linearly, the scale geometrically, so a zoom feels even. */
export function interpCam(a: Cam, b: Cam, t: number): Cam {
  return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, s: a.s * Math.pow(b.s / a.s, t) };
}

/** The bounding box [x, y, w, h] of a polygon or point list on the grid. */
export function polygonBox(points: ReadonlyArray<readonly [number, number]>): Box {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}
