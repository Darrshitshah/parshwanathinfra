/**
 * Availability. Owner: data-lead. Every status is "TBD" until Darshit supplies inventory data, so the explorer
 * legend reads "Availability on request". data-lead adds one entry per flat block from plan.json.
 */
import { inventorySchema, TBD, type Inventory } from "./schema";

const PLOT_COUNT = 165;

export const inventory: Inventory = inventorySchema.parse({
  updated: TBD,
  buildings: [],
  plots: Array.from({ length: PLOT_COUNT }, (_, index) => ({ number: index + 1, status: TBD })),
});
