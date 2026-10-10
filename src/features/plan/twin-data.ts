/**
 * The accessible twin: the same zones, buildings, plots and amenities as the drawing, as plain rows built from
 * content. Pure, so the list and the drawing cannot drift apart.
 */
import { plan } from "@/content/plan";
import { inventory } from "@/content/inventory";
import type { Typology } from "@/content/schema";
import { buildingTitle, floorCount, isExplorable } from "./plan-paths";
import { planStrings } from "./strings";

export const TYPOLOGY_LABEL: Record<Typology, string> = {
  flats: "Flats",
  rowhouses: "Row houses",
  shops: "Shops",
  mixed: "Mixed use",
  office: "Office",
  amenity: "Amenity",
};

export interface ZoneRow {
  id: string;
  name: string;
  buildings: number;
  typologies: string[];
  plots: number;
}

export interface BuildingRow {
  id: string;
  title: string;
  sheetTag: string;
  typology: Typology;
  typologyLabel: string;
  sector: string;
  floors: string;
  floorsIndicative: boolean;
  explorable: boolean;
  indicative: boolean;
}

export interface PlotRow {
  number: number;
  type: string;
  status: string;
  lowConfidence: boolean;
}

export interface AmenityRow {
  id: string;
  name: string;
  kind: string;
  evidence: string;
  labelTbd: boolean;
}

const unique = (values: string[]) => Array.from(new Set(values));

export function zoneRows(): ZoneRow[] {
  const sectors = unique(plan.buildings.map((b) => b.sector).filter((s) => s !== "TBD")).sort();
  const sectorRows: ZoneRow[] = sectors.map((sector) => {
    const inSector = plan.buildings.filter((b) => b.sector === sector);
    return {
      id: `sector-${sector}`,
      name: planStrings.twin.sector(sector),
      buildings: inSector.length,
      typologies: unique(inSector.map((b) => TYPOLOGY_LABEL[b.typology])),
      plots: 0,
    };
  });
  const districtRows: ZoneRow[] = plan.districts.map((district) => ({
    id: `district-${district.id}`,
    name: district.name,
    buildings: plan.buildings.filter((b) => b.typology === "rowhouses").length,
    typologies: [TYPOLOGY_LABEL.rowhouses],
    plots: plan.plots.length,
  }));
  const loose = plan.buildings.filter((b) => b.sector === "TBD" && b.typology !== "rowhouses");
  const looseRow: ZoneRow[] =
    loose.length > 0
      ? [{ id: "sector-unstated", name: planStrings.twin.sectorUnstated, buildings: loose.length, typologies: unique(loose.map((b) => TYPOLOGY_LABEL[b.typology])), plots: 0 }]
      : [];
  return [...sectorRows, ...districtRows, ...looseRow];
}

export function buildingRows(): BuildingRow[] {
  return plan.buildings.map((building) => {
    const floors = floorCount(building);
    return {
      id: building.id,
      title: buildingTitle(building),
      sheetTag: building.sheetTag,
      typology: building.typology,
      typologyLabel: TYPOLOGY_LABEL[building.typology],
      sector: building.sector,
      floors: building.floors === "TBD" ? "TBD" : String(building.floors),
      floorsIndicative: building.floors === "TBD" && floors.count !== null,
      explorable: isExplorable(building),
      indicative: building.indicative,
    };
  });
}

export function plotStatus(number: number): string {
  return inventory.plots.find((p) => p.number === number)?.status ?? plan.plots.find((p) => p.number === number)?.status ?? "TBD";
}

export function plotRows(): PlotRow[] {
  return plan.plots.map((plot) => ({
    number: plot.number,
    type: plot.type,
    status: plotStatus(plot.number),
    lowConfidence: plot.numberConfidence === "low",
  }));
}

export function amenityRows(): AmenityRow[] {
  return plan.amenities.map((amenity) => ({
    id: amenity.id,
    name: amenity.name,
    kind: amenity.kind,
    evidence: amenity.evidence,
    labelTbd: amenity.labelTbd,
  }));
}
