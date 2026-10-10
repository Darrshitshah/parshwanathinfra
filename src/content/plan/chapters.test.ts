import { describe, expect, it } from "vitest";
import { hasForbiddenDash } from "../schema";
import { chapterById, chapters } from "./chapters";
import { plan } from "./index";
import { refExists, refPoint } from "./refs";

const STAGE_RATIO = 20 / 11;

describe("chapters", () => {
  it("has the six S3 chapters in order", () => {
    expect(chapters.map((chapter) => chapter.id)).toEqual(["entry", "boulevard", "flats", "spine-and-gate", "row-houses", "the-tip"]);
    expect(chapters.map((chapter) => chapter.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(chapterById("flats")?.title).toBe("Flats");
    expect(chapterById("nope")).toBeUndefined();
  });

  it("gives every chapter a camera box on the render grid with the stage ratio", () => {
    for (const chapter of chapters) {
      const [x, y, w, h] = chapter.view;
      expect(w / h, chapter.id).toBeCloseTo(STAGE_RATIO, 2);
      expect(x, chapter.id).toBeGreaterThanOrEqual(0);
      expect(y, chapter.id).toBeGreaterThanOrEqual(0);
      expect(x + w, chapter.id).toBeLessThanOrEqual(plan.grid.width);
      expect(y + h, chapter.id).toBeLessThanOrEqual(plan.grid.height);
    }
  });

  it("keeps every hotspot on a real plan element, inside its chapter's camera box", () => {
    for (const chapter of chapters) {
      expect(chapter.hotspots.length, chapter.id).toBeGreaterThanOrEqual(3);
      const [x, y, w, h] = chapter.view;
      for (const hotspot of chapter.hotspots) {
        expect(hotspot.ref && refExists(hotspot.ref), `${chapter.id}/${hotspot.id}`).toBe(true);
        const [px, py] = hotspot.point;
        expect(px, hotspot.id).toBeGreaterThanOrEqual(x);
        expect(px, hotspot.id).toBeLessThanOrEqual(x + w);
        expect(py, hotspot.id).toBeGreaterThanOrEqual(y);
        expect(py, hotspot.id).toBeLessThanOrEqual(y + h);
      }
    }
  });

  it("has unique hotspot ids and copy without em or en dashes", () => {
    const ids = chapters.flatMap((chapter) => chapter.hotspots.map((hotspot) => hotspot.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const chapter of chapters) {
      expect(hasForbiddenDash(`${chapter.title} ${chapter.body}`)).toBe(false);
    }
  });

  it("flags the tip building as an unconfirmed label", () => {
    const hotspot = chapterById("the-tip")?.hotspots.find((h) => h.ref === "a-tip-building");
    expect(hotspot?.labelTbd).toBe(true);
  });
});

describe("refs", () => {
  it("resolves every kind of reference and rejects unknown ones", () => {
    expect(refPoint("b-shops-a")).toBeDefined();
    expect(refPoint("plot-1")).toBeDefined();
    expect(refPoint("road-boulevard-40ft", 0.3)).toBeDefined();
    expect(refPoint("g-garden-court-sector-01")).toBeDefined();
    expect(refPoint("a-roundabout-sculpture")).toEqual([1320, 651]);
    expect(refPoint("e-main-entry")).toEqual([1892, 652]);
    expect(refPoint("district-row-houses")).toBeDefined();
    expect(refExists("b-nothing")).toBe(false);
    expect(refExists("x-1")).toBe(false);
  });
});
