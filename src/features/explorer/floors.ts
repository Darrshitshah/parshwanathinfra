/**
 * The building explorer's model, built from content: floors per block, availability per floor, the units on a floor.
 * Floors are confirmed in the plan (Ground, 1st to 5th floor, roof terrace above); a block whose floors were still "TBD"
 * would fall back to `floorsIndicative`, always marked indicative. Availability comes from inventory.ts and is "TBD" everywhere today ("Availability on request").
 */
import { inventory } from "@/content/inventory";
import { buildingById, plan } from "@/content/plan";
import type { Building, UnitStatus, UnitType } from "@/content/schema";
import { unitTypes, getUnitType } from "@/content/units";
import { explorerStrings } from "./strings";

export type InventoryUnit = { id: string; floor: number; unitTypeId: string; status: UnitStatus };

export interface FloorBand {
  /** 0 is the lowest band. */
  index: number;
  label: string;
  /** Floor count is an estimate from the renders, not confirmed. */
  indicative: boolean;
  status: UnitStatus;
  /** Units on this floor, or null while the unit list is TBD. */
  units: InventoryUnit[] | null;
}

export interface ExplorerModel {
  building: Building;
  title: string;
  /** The count drawn; null when there is no count at all. */
  floorCount: number | null;
  /** True when the count is the render-based estimate. */
  floorsIndicative: boolean;
  /** A roof terrace sits above the top floor (shown as a band that cannot be selected). */
  terrace: boolean;
  /** Bands from the lowest to the highest. */
  bands: FloorBand[];
  unitsKnown: boolean;
  /** Statuses present among the bands; only "TBD" means "Availability on request". */
  statuses: UnitStatus[];
  /** Plans that exist, offered as samples while units are not matched to floors. */
  samples: readonly UnitType[];
}

const ORDER: UnitStatus[] = ["available", "booked", "sold"];

/** One status for a floor: any available beats booked beats sold; no data is TBD. */
export function floorStatus(units: readonly InventoryUnit[] | null): UnitStatus {
  if (!units || units.length === 0) return "TBD";
  for (const status of ORDER) {
    if (units.some((unit) => unit.status === status)) return status;
  }
  return "TBD";
}

export function bandLabel(index: number, indicative: boolean): string {
  if (indicative) return explorerStrings.levelLabel(index + 1);
  return index === 0 ? explorerStrings.groundLabel : explorerStrings.floorLabel(index);
}

export function explorerModel(buildingId: string): ExplorerModel | null {
  const building = buildingById(buildingId);
  if (!building) return null;
  const record = inventory.buildings.find((entry) => entry.buildingId === buildingId);

  let floorCount: number | null = null;
  let floorsIndicative = false;
  if (record && record.floors !== "TBD") floorCount = record.floors;
  else if (building.floors !== "TBD") floorCount = building.floors;
  else if (building.floorsIndicative) {
    floorCount = building.floorsIndicative;
    floorsIndicative = true;
  }

  const units = record && record.units !== "TBD" ? (record.units as InventoryUnit[]) : null;
  const bands: FloorBand[] = Array.from({ length: floorCount ?? 0 }, (_, index) => {
    const onFloor = units ? units.filter((unit) => unit.floor === index) : null;
    return { index, label: bandLabel(index, floorsIndicative), indicative: floorsIndicative, status: floorStatus(onFloor), units: onFloor };
  });

  return {
    building,
    title: building.label ?? (building.sheetTag === "TBD" ? building.id : building.sheetTag),
    floorCount,
    floorsIndicative,
    terrace: floorCount !== null && !floorsIndicative,
    bands,
    unitsKnown: units !== null,
    statuses: Array.from(new Set(bands.map((band) => band.status))),
    samples: unitTypes,
  };
}

/** Width of the schematic elevation, derived from how long the block is on the plan (relative to the longest block). */
export function massingWidth(building: Building, min = 220, span = 160): number {
  const longSide = (polygon: Building["polygon"]) => {
    const xs = polygon.map((p) => p[0]);
    const ys = polygon.map((p) => p[1]);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  };
  const flats = plan.buildings.filter((b) => b.typology === "flats" || b.typology === "mixed");
  const longest = Math.max(...flats.map((b) => longSide(b.polygon)));
  return Math.round(min + span * (longSide(building.polygon) / longest));
}

/** The enquiry text for a home: block, floor and plan, only from what is known. */
export function unitEnquiryLabel(title: string, floorLabel: string | null, unitLabel: string | null): string {
  return [title, floorLabel, unitLabel].filter((part): part is string => Boolean(part)).join(", ");
}

export { getUnitType };
