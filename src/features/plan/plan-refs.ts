/**
 * What a plan reference points at. Hotspots name plan elements by their SVG id (`b-<id>`, `plot-<n>` ...), the same
 * names the web plan SVG uses; this decides what activating one does.
 */
import { buildingById } from "@/content/plan";
import { isExplorable } from "./plan-paths";

export type RefTarget =
  | { kind: "plot"; number: number }
  | { kind: "building"; id: string; explorable: boolean; typology: string }
  | { kind: "other" };

export function parseRef(ref: string | undefined): RefTarget {
  if (!ref) return { kind: "other" };
  if (ref.startsWith("plot-")) {
    const number = Number(ref.slice("plot-".length));
    return Number.isInteger(number) ? { kind: "plot", number } : { kind: "other" };
  }
  if (ref.startsWith("b-")) {
    const building = buildingById(ref.slice("b-".length));
    if (building) return { kind: "building", id: building.id, explorable: isExplorable(building), typology: building.typology };
  }
  return { kind: "other" };
}
