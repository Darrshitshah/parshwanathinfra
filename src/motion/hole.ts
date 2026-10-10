/**
 * The township-shaped hole in a curtain. Owner: motion-lead.
 *
 * A curtain is one SVG path (`fill-rule: evenodd`): a huge rectangle with the township polygon cut out of it.
 * Scaling the polygon about its centre opens or closes the hole, so the old page shrinks away through the
 * township's outline, or the new page grows out of it. Only the path data changes; there is no mask layer.
 */
import {
  coverScale,
  outerRect,
  polygonBounds,
  scalePolygon,
  sheetWithHolePath,
  type Point,
  type Rect,
} from "./geometry";

/** Below this scale the hole is treated as closed (nothing is cut out). */
export const HOLE_CLOSED_SCALE = 0.002;
/** Used when the screen cannot be measured (tests, detached SVG). Large enough for any real township shape. */
export const FALLBACK_COVER_SCALE = 6;

export interface HoleController {
  /** 0 or tiny: closed. 1: natural size on the render grid. `measureCoverScale()`: fills the screen. */
  setScale(scale: number): void;
  getScale(): number;
  /** The scale at which the hole covers the whole viewport right now (measured from the SVG's screen box). */
  measureCoverScale(): number;
  /** Scale origin on the render grid (the polygon's bounding-box centre by default). */
  readonly origin: Point;
}

export interface CreateHoleOptions {
  /** The SVG that owns the path. Defaults to `path.ownerSVGElement`. */
  svg?: SVGSVGElement | null;
  origin?: Point;
}

/**
 * The screen of an SVG, expressed in the SVG's own user space (its viewBox coordinates). This is the rectangle a
 * township-shaped hole has to cover to fill the viewport. Null when it cannot be measured (tests, detached SVG).
 */
export function measureViewportRect(svg: SVGSVGElement | null | undefined): Rect | null {
  const screenMatrix = svg?.getScreenCTM?.() ?? null;
  if (!svg || !screenMatrix) return null;
  const box = svg.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const inverse = screenMatrix.inverse();
  const corners = [
    [box.left, box.top],
    [box.right, box.top],
    [box.right, box.bottom],
    [box.left, box.bottom],
  ].map(([x, y]) => {
    const point = new DOMPoint(x, y).matrixTransform(inverse);
    return [point.x, point.y] as const;
  });
  return {
    left: Math.min(...corners.map(([x]) => x)),
    top: Math.min(...corners.map(([, y]) => y)),
    right: Math.max(...corners.map(([x]) => x)),
    bottom: Math.max(...corners.map(([, y]) => y)),
  };
}

export function createHole(
  path: SVGPathElement,
  polygon: readonly Point[],
  options: CreateHoleOptions = {},
): HoleController {
  const bounds = polygonBounds(polygon);
  const origin: Point = options.origin ?? [bounds.centerX, bounds.centerY];
  const outer = outerRect(bounds);
  let current = Number.NaN;

  const setScale = (scale: number) => {
    if (scale === current) return;
    current = scale;
    const hole = scale <= HOLE_CLOSED_SCALE ? [] : scalePolygon(polygon, origin, scale);
    path.setAttribute("d", sheetWithHolePath(outer, hole));
  };

  const measureCoverScale = () => {
    const rect = measureViewportRect(options.svg ?? path.ownerSVGElement);
    return rect ? coverScale(polygon, origin, rect) : FALLBACK_COVER_SCALE;
  };

  return { setScale, getScale: () => current, measureCoverScale, origin };
}
