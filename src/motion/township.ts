/**
 * The township's own shape, as the motion layer needs it. Owner: motion-lead.
 *
 * Geometry always comes from outside (plan.json via `src/content/plan`); nothing here knows a coordinate.
 * - Server components can pass `shapeFromPlan(plan)` (or just `plan.boundary`) as props, which keeps the plan data
 *   out of the client bundle.
 * - `MotionRoot` has an optional `shape` prop for the page curtain. Without it, it loads the plan lazily on first
 *   idle (Tier A and B only), in its own chunk, so the initial JavaScript stays small.
 */
import type { Plan } from "@/content/schema";
import type { Point } from "./geometry";

export interface TownshipShape {
  /** The site boundary on the render grid (2000 x 1342). */
  boundary: Point[];
  roundabout?: { center: Point; radius: number };
  /** The main entry on the render grid. */
  entry?: Point;
}

type PlanShapeSource = Pick<Plan, "boundary" | "roundabout" | "entries">;

/** Picks the three things the loader and curtain need from a parsed plan. */
export function shapeFromPlan(plan: PlanShapeSource): TownshipShape {
  const entry = plan.entries.find((candidate) => candidate.kind === "main") ?? plan.entries[0];
  return {
    boundary: plan.boundary,
    roundabout: plan.roundabout,
    entry: entry?.point,
  };
}

let loading: Promise<TownshipShape> | undefined;

/** Loads `src/content/plan` on demand (separate chunk) and returns its shape. Cached. */
export function loadTownshipShape(): Promise<TownshipShape> {
  loading ??= import("@/content/plan").then(({ plan }) => shapeFromPlan(plan));
  return loading;
}
