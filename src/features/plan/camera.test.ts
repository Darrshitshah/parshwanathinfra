import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";
import {
  boxCenter,
  camLimits,
  camTransform,
  clampCam,
  fitBox,
  gridToScreen,
  interpCam,
  keyToCommand,
  MAX_ZOOM_RATIO,
  panBy,
  screenToGrid,
  transformAttr,
  visibleBox,
  zoomAt,
  zoomRatio,
  type Box,
} from "./camera";

const SIZE = { w: 1440, h: 792 };
const BOUNDS: Box = plan.grid.viewBox;

describe("camera", () => {
  it("fits a box with meet and centres it", () => {
    const cam = fitBox([0, 0, 400, 200], { w: 800, h: 800 });
    expect(cam.s).toBe(2);
    expect([cam.cx, cam.cy]).toEqual(boxCenter([0, 0, 400, 200]));
    // portrait stage: the width limits the fit and the box is centred vertically
    const { tx, ty } = camTransform(cam, { w: 800, h: 800 });
    expect(tx).toBeCloseTo(0);
    expect(ty).toBeCloseTo(800 / 2 - 100 * 2);
  });

  it("the default plan view fills a 20:11 stage exactly", () => {
    const cam = fitBox(BOUNDS, SIZE);
    const [x, y, w, h] = visibleBox(cam, SIZE);
    expect(x).toBeCloseTo(BOUNDS[0]);
    expect(y).toBeCloseTo(BOUNDS[1]);
    expect(w).toBeCloseTo(BOUNDS[2]);
    expect(h).toBeCloseTo(BOUNDS[3]);
  });

  it("screen and grid coordinates round-trip", () => {
    const cam = { cx: 900, cy: 600, s: 1.7 };
    const [sx, sy] = gridToScreen(cam, SIZE, 1234, 456);
    const [gx, gy] = screenToGrid(cam, SIZE, sx, sy);
    expect(gx).toBeCloseTo(1234);
    expect(gy).toBeCloseTo(456);
  });

  it("zooms around the pointer and keeps that grid point under it", () => {
    const limits = camLimits(BOUNDS, SIZE);
    const cam = fitBox(BOUNDS, SIZE);
    const before = screenToGrid(cam, SIZE, 1100, 300);
    const zoomed = zoomAt(cam, SIZE, 1100, 300, 2, BOUNDS, limits);
    expect(zoomed.s).toBeCloseTo(cam.s * 2);
    const after = screenToGrid(zoomed, SIZE, 1100, 300);
    expect(after[0]).toBeCloseTo(before[0], 4);
    expect(after[1]).toBeCloseTo(before[1], 4);
  });

  it("clamps the zoom between the whole plan and the maximum", () => {
    const limits = camLimits(BOUNDS, SIZE);
    const cam = fitBox(BOUNDS, SIZE);
    expect(zoomAt(cam, SIZE, 700, 400, 0.1, BOUNDS, limits).s).toBeCloseTo(limits.min);
    expect(zoomAt(cam, SIZE, 700, 400, 1e6, BOUNDS, limits).s).toBeCloseTo(limits.max);
    expect(limits.max / limits.min).toBe(MAX_ZOOM_RATIO);
    expect(zoomRatio({ ...cam, s: limits.min * 2 }, limits)).toBeCloseTo(2);
  });

  it("pans by dragging and never leaves the plan", () => {
    const limits = camLimits(BOUNDS, SIZE);
    const zoomed = { cx: 1000, cy: 700, s: limits.min * 4 };
    const dragged = panBy(zoomed, 100, 0, BOUNDS, limits);
    expect(dragged.cx).toBeCloseTo(1000 - 100 / zoomed.s);
    const far = panBy(zoomed, -1e9, -1e9, BOUNDS, limits);
    expect(far.cx).toBe(BOUNDS[0] + BOUNDS[2]);
    expect(far.cy).toBe(BOUNDS[1] + BOUNDS[3]);
    expect(clampCam({ cx: -50, cy: 0, s: 0.0001 }, BOUNDS, limits)).toEqual({ cx: BOUNDS[0], cy: BOUNDS[1], s: limits.min });
  });

  it("writes a matrix attribute with the translation that centres the camera", () => {
    const attr = transformAttr({ cx: 1000, cy: 700, s: 2 }, { w: 1000, h: 600 });
    expect(attr).toBe("matrix(2 0 0 2 -1500 -1100)");
  });
});

describe("stage keyboard", () => {
  it("arrow keys pan, plus and minus zoom, zero resets", () => {
    expect(keyToCommand("ArrowLeft")).toMatchObject({ type: "pan", dx: expect.any(Number) });
    const left = keyToCommand("ArrowLeft");
    const right = keyToCommand("ArrowRight");
    expect(left && left.type === "pan" && right && right.type === "pan" && left.dx).toBe(right && right.type === "pan" ? -right.dx : NaN);
    expect(keyToCommand("+")).toMatchObject({ type: "zoom" });
    expect(keyToCommand("=")).toMatchObject({ type: "zoom" });
    const out = keyToCommand("-");
    expect(out && out.type === "zoom" && out.factor < 1).toBe(true);
    expect(keyToCommand("0")).toEqual({ type: "reset" });
    expect(keyToCommand("Escape")).toEqual({ type: "clear" });
  });

  it("digits 1 to 4 pick a typology, everything else is ignored", () => {
    expect(keyToCommand("3")).toEqual({ type: "digit", digit: "3" });
    expect(keyToCommand("5")).toBeNull();
    expect(keyToCommand("a")).toBeNull();
    expect(keyToCommand("Tab")).toBeNull();
  });

  it("leaves browser shortcuts alone", () => {
    expect(keyToCommand("+", { ctrl: true })).toBeNull();
    expect(keyToCommand("1", { meta: true })).toBeNull();
    expect(keyToCommand("ArrowLeft", { alt: true })).toBeNull();
  });
});

describe("interpCam", () => {
  it("returns the ends at 0 and 1 and zooms geometrically in between", () => {
    const a = { cx: 0, cy: 0, s: 1 };
    const b = { cx: 100, cy: 200, s: 4 };
    expect(interpCam(a, b, 0)).toEqual(a);
    expect(interpCam(a, b, 1)).toEqual(b);
    const mid = interpCam(a, b, 0.5);
    expect(mid.cx).toBe(50);
    expect(mid.cy).toBe(100);
    expect(mid.s).toBeCloseTo(2);
  });
});
