/**
 * How big a row-house plot is on the plan, derived from the plot polygons in content. Decides when the plot numbers
 * are large enough to read, so no size is typed into a component.
 */
import { plan } from "@/content/plan";
import { camLimits, zoomRatio, type Box, type Cam, type Size } from "./camera";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** The median short side of a plot, in grid units. */
export const typicalPlotSide: number = median(
  plan.plots.map((plot) => {
    const xs = plot.polygon.map((p) => p[0]);
    const ys = plot.polygon.map((p) => p[1]);
    return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }),
);

export const MIN_LABEL_SIDE_PX = 11;
export const MIN_LABEL_ZOOM = 1.5;

/** Plot numbers appear once a plot is big enough to hold one and the camera is in at row-house level. */
export function plotNumbersVisible(cam: Cam, size: Size, bounds: Box): boolean {
  return cam.s * typicalPlotSide >= MIN_LABEL_SIDE_PX && zoomRatio(cam, camLimits(bounds, size)) >= MIN_LABEL_ZOOM;
}
