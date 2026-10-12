/**
 * Availability. Owner: data-lead. Every status is "TBD" until Darshit supplies inventory data, so the explorer
 * legend reads "Availability on request". One entry per flat block (and the mixed-use building) from plan.json, with
 * the confirmed floor count (6 levels: Ground, 1st to 5th, roof terrace above; Darshit) and units "TBD": no unit list
 * exists yet.
 */
import { inventorySchema, TBD, type Inventory } from "./schema";
import { plan } from "./plan";

const PLOT_COUNT = 165;
const EXPLORER_TYPOLOGIES = new Set(["flats", "mixed"]);

export const inventory: Inventory = inventorySchema.parse({
  updated: TBD,
  buildings: plan.buildings
    .filter((building) => EXPLORER_TYPOLOGIES.has(building.typology))
    .map((building) => ({ buildingId: building.id, floors: building.floors, units: TBD })),
  plots: Array.from({ length: PLOT_COUNT }, (_, index) => ({ number: index + 1, status: TBD })),
});
