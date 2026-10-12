import { describe, expect, it } from "vitest";
import { chapters } from "@/content/plan/chapters";
import {
  activeStationIndex,
  buildStations,
  buildingHeight,
  gridToWorld,
  labelAnchors,
  poseAtProgress,
  sceneMeta,
  segmentAt,
  stationPose,
  verticalFovDeg,
} from "./stations";

const stations = buildStations(chapters);

describe("stations from chapters", () => {
  it("is the overview followed by one station per chapter, in order", () => {
    expect(stations.map((s) => s.id)).toEqual(["overview", ...chapters.map((c) => c.id)]);
  });

  it("uses the chapter view boxes, and the renders were made from the same boxes", () => {
    chapters.forEach((chapter, i) => expect(stations[i + 1].view).toEqual(chapter.view));
    const rendered = sceneMeta.camera.stations.map((s) => [s.id, ...s.view]);
    const current = stations.map((s) => [s.id, ...s.view]);
    // If this fails, chapters.ts changed: re-run tools/blender/cameras.py and the render scripts (see tools/blender/README.md).
    expect(rendered).toEqual(current);
  });

  it("matches the Blender camera positions (golden values, metres, three.js axes)", () => {
    const golden: Record<string, [number, number, number]> = {
      overview: [335.44, 813.88, 904.98],
      entry: [284.65, 211.83, 226.26],
      "the-tip": [-101.61, 194.59, 191.74],
    };
    for (const [id, expected] of Object.entries(golden)) {
      const station = stations.find((s) => s.id === id)!;
      station.position.forEach((v, axis) => expect(v).toBeCloseTo(expected[axis], 0));
    }
  });

  it("looks at the centre of the view box", () => {
    const [x, y, w, h] = chapters[0].view;
    const [tx, , tz] = gridToWorld([x + w / 2, y + h / 2]);
    expect(stations[1].target[0]).toBeCloseTo(tx, 6);
    expect(stations[1].target[2]).toBeCloseTo(tz, 6);
  });

  it("sits further back for a wider box", () => {
    const narrow = stationPose([1520, 520, 480, 264]);
    const wide = stationPose([536, 283, 1464, 805]);
    const dist = (p: { position: readonly number[]; target: readonly number[] }) => Math.hypot(...p.position.map((v, i) => v - p.target[i]));
    expect(dist(wide)).toBeGreaterThan(dist(narrow) * 2);
  });
});

describe("scroll timeline", () => {
  it("starts on the overview and ends on the last chapter", () => {
    expect(poseAtProgress(stations, 0).position).toEqual(stations[0].position);
    const last = poseAtProgress(stations, 1).position;
    stations[stations.length - 1].position.forEach((v, i) => expect(last[i]).toBeCloseTo(v, 6));
  });

  it("holds at each station and clamps out of range input", () => {
    const hold = poseAtProgress(stations, 0.02).position;
    stations[0].position.forEach((v, i) => expect(hold[i]).toBeCloseTo(v, 6));
    expect(poseAtProgress(stations, -3).position).toEqual(poseAtProgress(stations, 0).position);
    expect(poseAtProgress(stations, 9).position).toEqual(poseAtProgress(stations, 1).position);
  });

  it("travels monotonically between two stations", () => {
    const first = stations[0].position[1];
    const second = stations[1].position[1];
    const ys = [0.03, 0.06, 0.09, 0.12, 0.15].map((p) => poseAtProgress(stations, p).position[1]);
    const sign = Math.sign(second - first);
    ys.slice(1).forEach((y, i) => expect((y - ys[i]) * sign).toBeGreaterThanOrEqual(-1e-9));
  });

  it("names the active station for the caption", () => {
    const n = stations.length;
    expect(activeStationIndex(n, 0)).toBe(0);
    expect(activeStationIndex(n, 1)).toBe(n - 1);
    expect(segmentAt(n, 0.5).segment).toBe(Math.floor(0.5 * (n - 1)));
  });
});

describe("camera and labels", () => {
  it("keeps the horizontal field fixed: a narrower canvas gets a taller vertical field", () => {
    expect(verticalFovDeg(0.8)).toBeGreaterThan(verticalFovDeg(1.82));
    expect(verticalFovDeg(20 / 11)).toBeCloseTo(14.5, 0);
  });

  it("anchors building hotspots at the roof and sends their plan id with the click", () => {
    const entry = chapters.find((c) => c.id === "entry")!;
    const anchors = labelAnchors(entry);
    const shops = anchors.find((a) => a.id === "entry-shops-a")!;
    expect(shops.buildingId).toBe("shops-a");
    expect(shops.position[1]).toBeGreaterThan(buildingHeight("shops-a")!);
    expect(anchors.find((a) => a.id === "entry-main")!.buildingId).toBeUndefined();
  });

  it("marks the tip building label as unconfirmed", () => {
    const tip = labelAnchors(chapters.find((c) => c.id === "the-tip")!);
    expect(tip.find((a) => a.id === "tip-building")!.tbd).toBe(true);
  });

  it("has a roof height for every building in the plan", async () => {
    const { plan } = await import("@/content/plan");
    for (const b of plan.buildings) expect(buildingHeight(b.id), b.id).toBeGreaterThan(0);
  });
});

describe("confirmed heights in the model", () => {
  const byType = (t: string) => sceneMeta.buildings.filter((b) => b.typology === t);

  it("gives flats, mixed use and shops 6 levels of 3 m with a 1.1 m terrace parapet and a stair/lift block", () => {
    for (const t of ["flats", "mixed", "shops"]) {
      expect(byType(t).length, t).toBeGreaterThan(0);
      for (const b of byType(t)) {
        expect(b.floorsUsed, b.id).toBe(6);
        expect(b.floorsConfirmed, b.id).toBe(true);
        expect(b.heightM, b.id).toBeCloseTo(18 + 0.12, 1);
        expect(b.parapetM, b.id).toBe(1.1);
        expect(b.coreBlocks, b.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("gives row houses 2 storeys under a roof terrace parapet", () => {
    for (const b of byType("rowhouses")) {
      expect(b.floorsUsed, b.id).toBe(2);
      expect(b.heightM, b.id).toBeCloseTo(6 + 0.12, 1);
      expect(b.parapetM, b.id).toBe(1.1);
    }
  });
});
