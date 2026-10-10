/**
 * Small geometry helpers for plan data (render grid, y down). Owner: data-lead.
 * Used by chapters.ts and available to the plan features for labels and hit tests.
 */
import type { Point, Polygon } from "../schema";

export type Box = [x: number, y: number, w: number, h: number];

export function polygonBounds(polygon: Polygon): Box {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}

/** Area centroid (shoelace). Falls back to the vertex average for degenerate polygons. */
export function polygonCentroid(polygon: Polygon): Point {
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    const cross = x1 * y2 - x2 * y1;
    area2 += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(area2) < 1e-9) {
    return [polygon.reduce((s, p) => s + p[0], 0) / polygon.length, polygon.reduce((s, p) => s + p[1], 0) / polygon.length];
  }
  return [cx / (3 * area2), cy / (3 * area2)];
}

/** Even-odd point in polygon test. */
export function pointInPolygon([px, py]: Point, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToEdges(point: Point, polygon: Polygon): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    best = Math.min(best, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return best;
}

/**
 * A point that is inside the polygon and far from its edges (the visual centre), for labels and hotspots.
 * Coarse grid search, then a finer pass around the best cell. The area centroid is returned when it already is the best choice.
 */
export function labelPoint(polygon: Polygon): Point {
  const [x, y, w, h] = polygonBounds(polygon);
  let best: Point = polygonCentroid(polygon);
  let bestScore = pointInPolygon(best, polygon) ? distanceToEdges(best, polygon) : -1;
  const search = (x0: number, y0: number, x1: number, y1: number, step: number) => {
    for (let px = x0; px <= x1; px += step) {
      for (let py = y0; py <= y1; py += step) {
        const candidate: Point = [px, py];
        if (!pointInPolygon(candidate, polygon)) continue;
        const score = distanceToEdges(candidate, polygon);
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
    }
  };
  const coarse = Math.max(Math.min(w, h) / 24, 1);
  search(x, y, x + w, y + h, coarse);
  search(best[0] - coarse, best[1] - coarse, best[0] + coarse, best[1] + coarse, coarse / 8);
  return [Math.round(best[0] * 10) / 10, Math.round(best[1] * 10) / 10];
}

/** Point at fraction `t` (0 to 1) of the length of a polyline. */
export function pointAlong(line: Point[], t: number): Point {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    const len = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    lengths.push(len);
    total += len;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : target / lengths[i];
      return [line[i][0] + f * (line[i + 1][0] - line[i][0]), line[i][1] + f * (line[i + 1][1] - line[i][1])];
    }
    target -= lengths[i];
  }
  return line[0];
}

export function boxContains([bx, by, bw, bh]: Box, [x, y]: Point): boolean {
  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}
