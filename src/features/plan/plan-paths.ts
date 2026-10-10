/**
 * SVG path helpers for plan data. Geometry only ever comes from content (`@/content/plan`); these functions only
 * turn it into path strings and labels.
 */
import type { Building, Point } from "@/content/schema";

const round = (value: number) => Math.round(value * 10) / 10;

export function pathD(points: readonly Point[], close = true): string {
  if (points.length === 0) return "";
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}${close ? "Z" : ""}`;
}

/** "Block B18", falling back to the sheet tag, then the id. */
export function buildingTitle(building: Building): string {
  if (building.label) return building.label;
  return building.sheetTag === "TBD" ? building.id : building.sheetTag;
}

/** The floors a block shows: the real count when known, else the indicative estimate (marked as such). */
export function floorCount(building: Pick<Building, "floors" | "floorsIndicative">): { count: number | null; indicative: boolean } {
  if (building.floors !== "TBD") return { count: building.floors, indicative: false };
  return building.floorsIndicative ? { count: building.floorsIndicative, indicative: true } : { count: null, indicative: false };
}

/** Only flat blocks and the mixed-use building open the building explorer. */
export function isExplorable(building: Pick<Building, "typology">): boolean {
  return building.typology === "flats" || building.typology === "mixed";
}
