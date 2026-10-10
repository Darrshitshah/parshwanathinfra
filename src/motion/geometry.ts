/**
 * Pure plan geometry helpers. Owner: motion-lead.
 *
 * Everything that is cut from the township's shape (the loader, the page curtain) takes its coordinates as
 * arguments: a polygon on the render grid (see `plan.json`), never numbers baked into a component.
 * No DOM here, so all of it is unit-testable.
 */
import { clamp, clamp01 } from "./math";

export type Point = readonly [number, number];
export type ViewBox = readonly [number, number, number, number];

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const ZERO_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };

export function polygonBounds(points: readonly Point[]): Bounds {
  if (points.length === 0) return ZERO_BOUNDS;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/** Area-weighted centroid (shoelace). Falls back to the bounding-box centre for degenerate polygons. */
export function polygonCentroid(points: readonly Point[]): Point {
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    area2 += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(area2) < 1e-9) {
    const bounds = polygonBounds(points);
    return [bounds.centerX, bounds.centerY];
  }
  return [cx / (3 * area2), cy / (3 * area2)];
}

/** Even-odd ray casting. */
export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** A new polygon scaled about `origin` (the input is never mutated). */
export function scalePolygon(points: readonly Point[], origin: Point, scale: number): Point[] {
  return points.map(([x, y]) => [origin[0] + (x - origin[0]) * scale, origin[1] + (y - origin[1]) * scale] as const);
}

function num(value: number, precision: number): string {
  const factor = 10 ** precision;
  const rounded = Math.round(value * factor) / factor;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/** SVG path data for a closed polygon: "M1882 329L1768 325 ... Z". */
export function polygonToPath(points: readonly Point[], precision = 2): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const segments = rest.map(([x, y]) => `L${num(x, precision)} ${num(y, precision)}`);
  return `M${num(first[0], precision)} ${num(first[1], precision)}${segments.join("")}Z`;
}

/** SVG path data for an open polyline: "M0 0L10 0L10 10" (roads, centrelines). */
export function polylineToPath(points: readonly Point[], precision = 2): string {
  const closed = polygonToPath(points, precision);
  return closed.endsWith("Z") ? closed.slice(0, -1) : closed;
}

/** SVG path data for a circle (two arcs), so a circle can be drawn, scaled or used as one subpath. */
export function circleToPath(cx: number, cy: number, radius: number, precision = 2): string {
  const left = num(cx - radius, precision);
  const right = num(cx + radius, precision);
  const y = num(cy, precision);
  const r = num(radius, precision);
  return `M${left} ${y}A${r} ${r} 0 1 0 ${right} ${y}A${r} ${r} 0 1 0 ${left} ${y}Z`;
}

/** A rectangle centred on `bounds`, `factor` times its largest side across: covers any screen the stage can land on. */
export function outerRect(bounds: Bounds, factor = 8): Rect {
  const half = (Math.max(bounds.width, bounds.height, 1) * factor) / 2;
  return {
    left: bounds.centerX - half,
    top: bounds.centerY - half,
    right: bounds.centerX + half,
    bottom: bounds.centerY + half,
  };
}

/**
 * One path with a hole: a big rectangle plus the polygon, meant for `fill-rule="evenodd"`.
 * The sheet is the curtain; the hole is the township.
 */
export function sheetWithHolePath(outer: Rect, hole: readonly Point[], precision = 1): string {
  const rect = `M${num(outer.left, precision)} ${num(outer.top, precision)}H${num(outer.right, precision)}V${num(outer.bottom, precision)}H${num(outer.left, precision)}Z`;
  return hole.length >= 3 ? rect + polygonToPath(hole, precision) : rect;
}

/** A uniform margin of `ratio` times the largest side around `bounds`, as an SVG viewBox. */
export function paddedViewBox(bounds: Bounds, ratio = 0.08): [number, number, number, number] {
  const pad = Math.max(bounds.width, bounds.height) * ratio;
  return [bounds.minX - pad, bounds.minY - pad, bounds.width + pad * 2, bounds.height + pad * 2];
}

/** The smallest bounds that hold both inputs. */
export function unionBounds(a: Bounds, b: Bounds): Bounds {
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.maxX, b.maxX);
  const maxY = Math.max(a.maxY, b.maxY);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
}

/** Points along the perimeter of `rect` (corners included), for coverage tests. */
function perimeterSamples(rect: Rect, perEdge: number): Point[] {
  const samples: Point[] = [];
  for (let i = 0; i < perEdge; i += 1) {
    const t = i / perEdge;
    const x = rect.left + (rect.right - rect.left) * t;
    const y = rect.top + (rect.bottom - rect.top) * t;
    samples.push([x, rect.top], [rect.right, y], [rect.right - (x - rect.left), rect.bottom], [rect.left, rect.bottom - (y - rect.top)]);
  }
  return samples;
}

function scaledPolygonCovers(polygon: readonly Point[], origin: Point, scale: number, samples: readonly Point[]): boolean {
  // A sample is inside the polygon scaled about `origin` exactly when its pre-image is inside the original.
  const inverse = 1 / scale;
  return samples.every(([x, y]) =>
    pointInPolygon([origin[0] + (x - origin[0]) * inverse, origin[1] + (y - origin[1]) * inverse], polygon),
  );
}

const COVER_GROWTH = 1.6;
const COVER_MAX_STEPS = 28;
const COVER_BISECT_STEPS = 26;
const COVER_RETRY_STEPS = 8;

/**
 * The scale at which `polygon`, scaled about `origin`, covers every point of `rect`'s edge (so the whole rect).
 * Used for the iris-style reveal: the township's outline grows until it fills the screen.
 * `margin` leaves a little room so the edge never grazes a corner.
 */
export function coverScale(polygon: readonly Point[], origin: Point, rect: Rect, margin = 1.05): number {
  if (polygon.length < 3) return 1;
  const samples = perimeterSamples(rect, 12);

  let low = 0;
  let high = 1;
  let steps = 0;
  while (!scaledPolygonCovers(polygon, origin, high, samples) && steps < COVER_MAX_STEPS) {
    low = high;
    high *= COVER_GROWTH;
    steps += 1;
  }
  for (let i = 0; i < COVER_BISECT_STEPS; i += 1) {
    const mid = (low + high) / 2;
    if (mid <= 0) break;
    if (scaledPolygonCovers(polygon, origin, mid, samples)) high = mid;
    else low = mid;
  }

  let scale = high * margin;
  for (let i = 0; i < COVER_RETRY_STEPS && !scaledPolygonCovers(polygon, origin, scale, samples); i += 1) {
    scale *= 1.1;
  }
  return scale;
}

export interface EntryArrow {
  /** One path (shaft plus a two-stroke head), so DrawSVG draws it as one line. */
  path: string;
  /** Every point the arrow touches, for bounds. */
  points: Point[];
}

/**
 * The entry arrow for the loader: a shaft pointing from outside the plan, through `entry`, toward `toward`
 * (usually the township's centre), with a two-stroke head.
 */
export function entryArrow(entry: Point, toward: Point, size: number, precision = 1): EntryArrow {
  const dx = toward[0] - entry[0];
  const dy = toward[1] - entry[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const head = size * 0.32;
  const tail: Point = [entry[0] - ux * size, entry[1] - uy * size];
  const tip: Point = [entry[0] + ux * size * 0.3, entry[1] + uy * size * 0.3];
  const left: Point = [tip[0] - ux * head + nx * head * 0.6, tip[1] - uy * head + ny * head * 0.6];
  const right: Point = [tip[0] - ux * head - nx * head * 0.6, tip[1] - uy * head - ny * head * 0.6];
  const at = (p: Point) => `${num(p[0], precision)} ${num(p[1], precision)}`;
  return {
    path: `M${at(tail)}L${at(tip)}M${at(left)}L${at(tip)}L${at(right)}`,
    points: [tail, tip, left, right],
  };
}

/** Same as `entryArrow(...).path`. */
export function entryArrowPath(entry: Point, toward: Point, size: number, precision = 1): string {
  return entryArrow(entry, toward, size, precision).path;
}

const CLOSED_CLIP = 'path("M0 0Z")';
const MIN_VISIBLE_PROGRESS = 0.0005;

/**
 * CSS `clip-path: path(...)` for the row-house "blinds": N strips across a `width` x `height` box, strip i open
 * by `progress[i]` (0 closed, 1 fully open), each opening from its own centre line like a venetian blind.
 */
export function blindsClipPath(
  width: number,
  height: number,
  progress: readonly number[],
  orientation: "vertical" | "horizontal" = "vertical",
): string {
  const count = progress.length;
  if (count === 0 || width <= 0 || height <= 0) return CLOSED_CLIP;
  const vertical = orientation === "vertical";
  const pitch = (vertical ? width : height) / count;
  const parts: string[] = [];
  progress.forEach((raw, index) => {
    const open = clamp01(raw);
    if (open <= MIN_VISIBLE_PROGRESS) return;
    const size = pitch * open;
    const start = index * pitch + (pitch - size) / 2;
    const end = start + size;
    parts.push(
      vertical
        ? `M${num(start, 1)} 0H${num(end, 1)}V${num(height, 1)}H${num(start, 1)}Z`
        : `M0 ${num(start, 1)}H${num(width, 1)}V${num(end, 1)}H0Z`,
    );
  });
  return parts.length > 0 ? `path("${parts.join("")}")` : CLOSED_CLIP;
}

/** Distance helper used by the iris: how far the origin is from the farthest corner of a box. */
export function farthestCornerDistance(width: number, height: number, originX: number, originY: number): number {
  const x = clamp(originX, 0, width);
  const y = clamp(originY, 0, height);
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}
