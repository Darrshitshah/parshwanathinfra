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
