import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";
import {
  blindsClipPath,
  circleToPath,
  coverScale,
  entryArrowPath,
  farthestCornerDistance,
  outerRect,
  paddedViewBox,
  pointInPolygon,
  polygonBounds,
  polygonCentroid,
  polygonToPath,
  polylineToPath,
  scalePolygon,
  sheetWithHolePath,
  unionBounds,
  type Point,
} from "./geometry";

const square: Point[] = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

// A concave "C" shape: the notch on the right is outside the polygon.
const cShape: Point[] = [
  [0, 0],
  [100, 0],
  [100, 30],
  [40, 30],
  [40, 70],
  [100, 70],
  [100, 100],
  [0, 100],
];

describe("polygonBounds", () => {
  it("measures a polygon and its centre", () => {
    expect(polygonBounds(square)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      width: 100,
      height: 100,
      centerX: 50,
      centerY: 50,
    });
  });

  it("returns zeros for an empty polygon", () => {
    expect(polygonBounds([])).toMatchObject({ width: 0, height: 0, centerX: 0, centerY: 0 });
  });
});

describe("polygonCentroid", () => {
  it("finds the centre of a square and of a triangle", () => {
    expect(polygonCentroid(square)).toEqual([50, 50]);
    const [x, y] = polygonCentroid([
      [0, 0],
      [6, 0],
      [0, 6],
    ]);
    expect(x).toBeCloseTo(2);
    expect(y).toBeCloseTo(2);
  });

  it("does not depend on winding order", () => {
    expect(polygonCentroid([...square].reverse())).toEqual([50, 50]);
  });

  it("falls back to the bounding-box centre when the area is zero", () => {
    expect(
      polygonCentroid([
        [0, 0],
        [10, 10],
        [20, 20],
      ]),
    ).toEqual([10, 10]);
  });
});

describe("pointInPolygon", () => {
  it("handles convex and concave shapes", () => {
    expect(pointInPolygon([50, 50], square)).toBe(true);
    expect(pointInPolygon([150, 50], square)).toBe(false);
    expect(pointInPolygon([20, 50], cShape)).toBe(true);
    expect(pointInPolygon([80, 50], cShape)).toBe(false);
  });
});

describe("scalePolygon", () => {
  it("scales about an origin and leaves the input alone", () => {
    const scaled = scalePolygon(square, [50, 50], 2);
    expect(scaled[0]).toEqual([-50, -50]);
    expect(scaled[2]).toEqual([150, 150]);
    expect(square[0]).toEqual([0, 0]);
  });

  it("collapses to the origin at scale 0", () => {
    expect(scalePolygon(square, [10, 20], 0).every(([x, y]) => x === 10 && y === 20)).toBe(true);
  });
});

describe("path builders", () => {
  it("writes a closed polygon path", () => {
    expect(polygonToPath(square)).toBe("M0 0L100 0L100 100L0 100Z");
    expect(polygonToPath([])).toBe("");
  });

  it("rounds to the requested precision and avoids negative zero", () => {
    expect(polygonToPath([[-0.0004, 1.23456]], 2)).toBe("M0 1.23Z");
  });

  it("writes an open polyline without closing it", () => {
    expect(polylineToPath([[0, 0], [10, 0], [10, 10]])).toBe("M0 0L10 0L10 10");
    expect(polylineToPath([])).toBe("");
  });

  it("writes a circle as two arcs", () => {
    expect(circleToPath(10, 20, 5)).toBe("M5 20A5 5 0 1 0 15 20A5 5 0 1 0 5 20Z");
  });

  it("cuts the polygon out of a sheet", () => {
    const outer = outerRect(polygonBounds(square), 4);
    const open = sheetWithHolePath(outer, square);
    expect(open.match(/Z/g)).toHaveLength(2);
    expect(sheetWithHolePath(outer, [])).toMatch(/^M[^M]*Z$/);
  });
});

describe("outerRect, paddedViewBox, unionBounds", () => {
  it("builds a rectangle centred on the polygon", () => {
    expect(outerRect(polygonBounds(square), 4)).toEqual({ left: -150, top: -150, right: 250, bottom: 250 });
  });

  it("pads by a ratio of the largest side", () => {
    expect(paddedViewBox(polygonBounds(square), 0.1)).toEqual([-10, -10, 120, 120]);
  });

  it("unions two bounds", () => {
    const other = polygonBounds([
      [90, -20],
      [140, 10],
    ]);
    expect(unionBounds(polygonBounds(square), other)).toMatchObject({ minX: 0, minY: -20, maxX: 140, maxY: 100 });
  });
});

describe("coverScale", () => {
  const rect = { left: 0, top: 25, right: 200, bottom: 75 };

  it("finds the scale at which a square covers a wider rectangle", () => {
    const scale = coverScale(square, [50, 50], { left: -50, top: 0, right: 150, bottom: 100 }, 1);
    expect(scale).toBeCloseTo(2, 1);
  });

  it("grows with the safety margin", () => {
    const tight = coverScale(square, [50, 50], rect, 1);
    const loose = coverScale(square, [50, 50], rect, 1.2);
    expect(loose).toBeGreaterThan(tight);
  });

  it("returns 1 for a degenerate polygon", () => {
    expect(coverScale([], [0, 0], rect)).toBe(1);
  });

  it("covers the whole rectangle for the real township boundary at desktop and phone aspect ratios", () => {
    const boundary = plan.boundary;
    const bounds = polygonBounds(boundary);
    const origin: Point = [bounds.centerX, bounds.centerY];
    for (const [width, height] of [
      [1440, 900],
      [360, 800],
      [2560, 1080],
    ]) {
      const k = Math.min(width / bounds.width, height / bounds.height);
      const rectInUnits = {
        left: origin[0] - width / k / 2,
        right: origin[0] + width / k / 2,
        top: origin[1] - height / k / 2,
        bottom: origin[1] + height / k / 2,
      };
      const scale = coverScale(boundary, origin, rectInUnits);
      const scaled = scalePolygon(boundary, origin, scale);
      const corners: Point[] = [
        [rectInUnits.left, rectInUnits.top],
        [rectInUnits.right, rectInUnits.top],
        [rectInUnits.right, rectInUnits.bottom],
        [rectInUnits.left, rectInUnits.bottom],
      ];
      expect(corners.every((corner) => pointInPolygon(corner, scaled))).toBe(true);
      expect(scale).toBeGreaterThan(1);
      expect(scale).toBeLessThan(40);
    }
  });
});

describe("entryArrowPath", () => {
  it("draws a shaft and a two-stroke head pointing toward the township", () => {
    expect(entryArrowPath([100, 0], [0, 0], 10)).toBe("M110 0L97 0M100.2 -1.9L97 0L100.2 1.9");
  });

  it("copes with the entry sitting exactly on the target", () => {
    expect(entryArrowPath([5, 5], [5, 5], 10)).toMatch(/^M/);
  });
});

describe("blindsClipPath", () => {
  it("is fully clipped when every strip is closed", () => {
    expect(blindsClipPath(100, 50, [0, 0, 0, 0])).toBe('path("M0 0Z")');
    expect(blindsClipPath(0, 50, [1])).toBe('path("M0 0Z")');
  });

  it("opens strips from their centre lines", () => {
    expect(blindsClipPath(100, 50, [1, 1, 1, 1])).toBe(
      'path("M0 0H25V50H0ZM25 0H50V50H25ZM50 0H75V50H50ZM75 0H100V50H75Z")',
    );
    const half = blindsClipPath(100, 50, [0.5, 0, 0, 0]);
    expect(half).toBe('path("M6.3 0H18.8V50H6.3Z")');
  });

  it("supports horizontal bands", () => {
    expect(blindsClipPath(100, 50, [1, 0], "horizontal")).toBe('path("M0 0H100V25H0Z")');
  });

  it("clamps progress outside 0 to 1", () => {
    expect(blindsClipPath(100, 50, [3, -1], "vertical")).toBe('path("M0 0H50V50H0Z")');
  });
});

describe("farthestCornerDistance", () => {
  it("measures to the far corner", () => {
    expect(farthestCornerDistance(100, 100, 0, 0)).toBeCloseTo(141.42, 1);
    expect(farthestCornerDistance(100, 100, 50, 50)).toBeCloseTo(70.71, 1);
  });

  it("clamps an origin outside the box", () => {
    expect(farthestCornerDistance(100, 100, -500, -500)).toBeCloseTo(141.42, 1);
  });
});
