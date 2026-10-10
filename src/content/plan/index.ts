/**
 * Typed access to the plan data. Owner: data-lead.
 *
 * Geometry lives only in plan.json (render grid 2000 x 1342, y down) and is validated here with planSchema,
 * so a bad edit fails at import time. Components never hold coordinates.
 *
 * Exports: `plan`, `planTransform` (CAD display points to the render grid), helpers (`buildingsByTypology`,
 * `buildingById`, `plotByNumber`, `roadById`, `cadToGrid`). Chapters live in `./chapters` (import `chapters` from "@/content/plan/chapters": it is kept out of this barrel so
 * that chapters.ts and refs.ts, which both import this file, cannot form an import cycle).
 */
import {
  planSchema,
  transformSchema,
  type Building,
  type Plan,
  type PlanTransform,
  type Plot,
  type Point,
  type Road,
  type Typology,
} from "../schema";
import planJson from "./plan.json";
import transformJson from "./transform.json";

export const plan: Plan = planSchema.parse(planJson);
export const planTransform: PlanTransform = transformSchema.parse(transformJson);

const buildingIndex = new Map(plan.buildings.map((building) => [building.id, building]));
const plotIndex = new Map(plan.plots.map((plot) => [plot.number, plot]));
const roadIndex = new Map(plan.roads.map((road) => [road.id, road]));

export function buildingsByTypology(typology: Typology): Building[] {
  return plan.buildings.filter((building) => building.typology === typology);
}

export function buildingById(id: string): Building | undefined {
  return buildingIndex.get(id);
}

export function plotByNumber(number: number): Plot | undefined {
  return plotIndex.get(number);
}

export function roadById(id: string): Road | undefined {
  return roadIndex.get(id);
}

/** Map a point on the 2022 CAD sheet (display points) to the render grid with the fitted transform. */
export function cadToGrid([x, y]: Point): Point {
  const [a, b, c, d, e, f] = planTransform.matrix;
  return [a * x + c * y + e, b * x + d * y + f];
}
