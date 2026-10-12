import { describe, expect, it } from "vitest";
import { inventory } from "./inventory";
import { plan } from "./plan";
import { isTbd } from "./schema";

describe("inventory", () => {
  it("has one entry per flat block and the mixed-use building, floors confirmed (6 levels) and units TBD", () => {
    const blocks = plan.buildings.filter((b) => b.typology === "flats" || b.typology === "mixed").map((b) => b.id);
    expect(inventory.buildings.map((b) => b.buildingId)).toEqual(blocks);
    for (const building of inventory.buildings) {
      expect(building.floors).toBe(6);
      expect(isTbd(building.units)).toBe(true);
    }
  });

  it("lists plots 1 to 165 with status TBD and no date", () => {
    expect(inventory.plots).toHaveLength(165);
    expect(new Set(inventory.plots.map((p) => p.number)).size).toBe(165);
    expect(inventory.plots.every((p) => p.status === "TBD")).toBe(true);
    expect(isTbd(inventory.updated)).toBe(true);
  });
});
