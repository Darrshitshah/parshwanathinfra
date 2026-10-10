import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";
import { chapters } from "@/content/plan/chapters";
import { fitBox } from "./camera";
import { plotNumbersVisible, typicalPlotSide } from "./plot-metrics";

const DESKTOP = { w: 1440, h: 792 };
const PHONE = { w: 360, h: 420 };
const rowHouses = chapters.find((chapter) => chapter.id === "row-houses");

describe("plot number visibility", () => {
  it("derives a plausible plot size from the data", () => {
    expect(typicalPlotSide).toBeGreaterThan(5);
    expect(typicalPlotSide).toBeLessThan(80);
  });

  it("hides the numbers on the whole plan and shows them at row-house zoom on a desktop", () => {
    expect(plotNumbersVisible(fitBox(plan.grid.viewBox, DESKTOP), DESKTOP, plan.grid.viewBox)).toBe(false);
    expect(rowHouses).toBeDefined();
    const cam = fitBox(rowHouses!.view, DESKTOP);
    expect(plotNumbersVisible(cam, DESKTOP, plan.grid.viewBox)).toBe(true);
  });

  it("asks a phone to zoom further before the numbers are legible", () => {
    const cam = fitBox(rowHouses!.view, PHONE);
    expect(plotNumbersVisible(cam, PHONE, plan.grid.viewBox)).toBe(false);
    expect(plotNumbersVisible({ ...cam, s: cam.s * 3 }, PHONE, plan.grid.viewBox)).toBe(true);
  });
});
