import { describe, expect, it } from "vitest";
import { chapters } from "@/content/plan/chapters";
import { fitBox } from "./camera";
import { cameraAtTime, chapterStart, easeInOut, INTRO_HOLD, scrollPerChapter, STEP, storyDuration, storyPhase, TRAVEL } from "./story";
import { plan } from "@/content/plan";

const N = chapters.length;

describe("story timeline", () => {
  it("covers the intro and every chapter of the data", () => {
    expect(N).toBe(6);
    expect(storyDuration(N)).toBeCloseTo(INTRO_HOLD + N * STEP);
    expect(chapterStart(0)).toBe(INTRO_HOLD);
  });

  it("shows the intro first, with no hotspots", () => {
    expect(storyPhase(0, N)).toEqual({ card: -1, spots: null });
    expect(storyPhase(INTRO_HOLD - 0.01, N)).toEqual({ card: -1, spots: null });
  });

  it("switches the text mid travel and fades hotspots in on arrival", () => {
    for (let k = 0; k < N; k += 1) {
      const start = chapterStart(k);
      expect(storyPhase(start + 0.1, N)).toEqual({ card: k - 1, spots: null });
      expect(storyPhase(start + 0.6, N)).toEqual({ card: k, spots: null });
      expect(storyPhase(start + 1.2, N)).toEqual({ card: k, spots: k });
    }
  });

  it("holds the last chapter at the end and never leaves the range", () => {
    expect(storyPhase(storyDuration(N), N)).toEqual({ card: N - 1, spots: N - 1 });
    expect(storyPhase(storyDuration(N) + 50, N)).toEqual({ card: N - 1, spots: N - 1 });
    expect(storyPhase(5, 0)).toEqual({ card: -1, spots: null });
  });

  it("pins for less scroll on Tier B", () => {
    expect(scrollPerChapter("B")).toBeLessThan(scrollPerChapter("A"));
  });
});

describe("camera along the timeline", () => {
  const size = { w: 1440, h: 792 };
  const stops = [fitBox(plan.grid.viewBox, size), ...chapters.map((chapter) => fitBox(chapter.view, size, 14))];

  it("eases in and out between 0 and 1", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.25)).toBeLessThan(0.25);
    expect(easeInOut(-3)).toBe(0);
    expect(easeInOut(9)).toBe(1);
  });

  it("rests on the whole plan during the intro and on each chapter during its hold", () => {
    expect(cameraAtTime(0, stops)).toEqual(stops[0]);
    expect(cameraAtTime(INTRO_HOLD, stops)).toEqual(stops[0]);
    for (let k = 0; k < chapters.length; k += 1) {
      expect(cameraAtTime(chapterStart(k) + TRAVEL, stops)).toEqual(stops[k + 1]);
      expect(cameraAtTime(chapterStart(k) + STEP - 0.01, stops)).toEqual(stops[k + 1]);
    }
    expect(cameraAtTime(storyDuration(chapters.length) + 5, stops)).toEqual(stops[chapters.length]);
  });

  it("is a function of time only: the same time gives the same view whichever way you got there", () => {
    const t = chapterStart(2) + 0.4;
    const first = cameraAtTime(t, stops);
    cameraAtTime(chapterStart(5), stops);
    cameraAtTime(0, stops);
    expect(cameraAtTime(t, stops)).toEqual(first);
    expect(first.s).toBeGreaterThan(Math.min(stops[2].s, stops[3].s) - 1e-9);
    expect(first.s).toBeLessThan(Math.max(stops[2].s, stops[3].s) + 1e-9);
  });
});
