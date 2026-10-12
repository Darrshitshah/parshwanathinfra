import { describe, expect, it } from "vitest";
import { buildingById, buildingsByTypology, cadToGrid, plan, planTransform, plotByNumber } from "./index";
import planJson from "./plan.json";
import { planSchema, transformSchema } from "../schema";
import transformJson from "./transform.json";

describe("plan.json", () => {
  it("parses with planSchema", () => {
    expect(planSchema.safeParse(planJson).success).toBe(true);
    expect(plan.grid.width).toBe(2000);
    expect(plan.grid.height).toBe(1342);
  });

  it("has unique building ids and finds buildings by id and typology", () => {
    const ids = plan.buildings.map((building) => building.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(buildingById("shops-a")?.typology).toBe("shops");
    expect(buildingsByTypology("office")).toHaveLength(1);
    expect(buildingById("does-not-exist")).toBeUndefined();
  });

  it("keeps every plot number unique and inside 1 to 165", () => {
    const numbers = plan.plots.map((plot) => plot.number);
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const plot of plan.plots) {
      expect(plot.number).toBeGreaterThanOrEqual(1);
      expect(plot.number).toBeLessThanOrEqual(165);
    }
    if (plan.plots.length > 0) expect(plotByNumber(plan.plots[0].number)).toBeDefined();
    expect(plotByNumber(0)).toBeUndefined();
  });

  it("has all 165 plots, each on an existing row-house strip", () => {
    expect(plan.plots).toHaveLength(165);
    for (let n = 1; n <= 165; n += 1) expect(plotByNumber(n), `plot ${n}`).toBeDefined();
    for (const plot of plan.plots) {
      const strip = buildingById(plot.strip);
      expect(strip, `strip of plot ${plot.number}`).toBeDefined();
      expect(strip?.typology).toBe("rowhouses");
    }
  });

  it("marks the plots read from the 2022 sheet high and the photo-read plots low", () => {
    const high = plan.plots.filter((plot) => plot.numberConfidence === "high").map((plot) => plot.number);
    const expected = [...Array.from({ length: 20 }, (_, i) => i + 1), ...Array.from({ length: 22 }, (_, i) => i + 144)];
    expect(high.sort((a, b) => a - b)).toEqual(expected);
  });

  it("keeps plot polygons inside the render grid area", () => {
    for (const plot of plan.plots) {
      for (const [x, y] of plot.polygon) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(plan.grid.width);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(plan.grid.height);
      }
    }
  });

  it("uses the sheet tags B1 to B21, C1 to C13, A and BLDG on the buildings that carry them", () => {
    const tags = new Set(
      plan.buildings.flatMap((building) => (building.sheetTag === "TBD" ? [] : building.sheetTag.split("/"))),
    );
    for (let n = 1; n <= 21; n += 1) expect(tags.has(`B${n}`), `B${n}`).toBe(true);
    for (let n = 1; n <= 13; n += 1) expect(tags.has(`C${n}`), `C${n}`).toBe(true);
    expect(tags.has("A")).toBe(true);
    expect(tags.has("BLDG")).toBe(true);
  });

  it("has unique ids across roads, gardens, amenities and entries", () => {
    for (const list of [plan.roads, plan.gardens, plan.amenities, plan.entries, plan.districts]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("describes the row-house district as indicative", () => {
    expect(plan.districts[0].name).toBe("Row houses, indicative as per the current layout plan");
    expect(plan.districts[0].indicative).toBe(true);
    for (const building of plan.buildings.filter((b) => b.typology === "rowhouses")) expect(building.indicative).toBe(true);
  });

  it("carries the confirmed floors: 6 levels for blocks, mixed use and shops A, 2 storeys for row houses, office TBD", () => {
    const expected = { flats: 6, mixed: 6, shops: 6, rowhouses: 2, office: "TBD" } as const;
    for (const building of plan.buildings) {
      expect(building.floors, building.id).toBe(expected[building.typology as keyof typeof expected]);
      expect(building.floorsIndicative, building.id).toBeUndefined();
    }
  });

  it("flags the clubhouse or temple at the tip as a label still to be confirmed", () => {
    const tip = plan.amenities.find((amenity) => amenity.id === "tip-building");
    expect(tip?.labelTbd).toBe(true);
  });
});

describe("transform.json", () => {
  it("parses with transformSchema and has at least 6 control points", () => {
    expect(transformSchema.safeParse(transformJson).success).toBe(true);
    expect(planTransform.controlPoints.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps every control point residual under 8 px, with rms and max consistent", () => {
    const residuals = planTransform.controlPoints.map((point) => point.residualPx);
    expect(Math.max(...residuals)).toBeLessThan(8);
    expect(planTransform.maxPx).toBeCloseTo(Math.max(...residuals), 1);
    const rms = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    expect(planTransform.rmsPx).toBeCloseTo(rms, 1);
  });

  it("recomputes each residual from the matrix", () => {
    for (const point of planTransform.controlPoints) {
      const [x, y] = cadToGrid(point.cad);
      const distance = Math.hypot(x - point.render[0], y - point.render[1]);
      expect(distance).toBeCloseTo(point.residualPx, 1);
    }
  });

  it("is a half turn at about 1.14 render px per CAD point", () => {
    const [a, b, , d] = planTransform.matrix;
    expect(a).toBeLessThan(0);
    expect(d).toBeLessThan(0);
    expect(Math.hypot(a, b)).toBeGreaterThan(1.1);
    expect(Math.hypot(a, b)).toBeLessThan(1.2);
  });

  it("gives plan.json the same scale as the transform", () => {
    expect(plan.metresPerPx).toBeCloseTo(planTransform.metresPerRenderPx, 4);
    expect(planTransform.metresPerRenderPx).toBeCloseTo(planTransform.metresPerCadPt / Math.hypot(planTransform.matrix[0], planTransform.matrix[1]), 3);
  });
});

describe("project amenities", () => {
  it("point only at amenity ids that exist in plan.json", async () => {
    const { shivShiva } = await import("../projects");
    const ids = new Set(plan.amenities.map((amenity) => amenity.id));
    for (const amenity of shivShiva.amenities) {
      if (amenity.planId) expect(ids.has(amenity.planId), amenity.planId).toBe(true);
    }
  });
});
