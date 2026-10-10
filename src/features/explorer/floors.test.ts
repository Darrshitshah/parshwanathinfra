import { describe, expect, it } from "vitest";
import { inventory } from "@/content/inventory";
import { plan } from "@/content/plan";
import { bandLabel, explorerModel, floorStatus, massingWidth, unitEnquiryLabel } from "./floors";

describe("explorer model", () => {
  it("builds one band per indicative floor from the plan, marked indicative", () => {
    const model = explorerModel("b18");
    expect(model).not.toBeNull();
    expect(model!.floorCount).toBe(6);
    expect(model!.floorsIndicative).toBe(true);
    expect(model!.bands).toHaveLength(6);
    expect(model!.bands.map((band) => band.label)).toEqual(["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6"]);
    expect(model!.bands.every((band) => band.indicative)).toBe(true);
  });

  it("says availability on request while every status is TBD", () => {
    const model = explorerModel("b1-b2")!;
    expect(model.statuses).toEqual(["TBD"]);
    expect(model.bands.every((band) => band.status === "TBD" && band.units === null)).toBe(true);
    expect(model.unitsKnown).toBe(false);
    expect(model.samples.length).toBeGreaterThan(0);
  });

  it("has a model for every flat block and the mixed-use building in the inventory", () => {
    for (const record of inventory.buildings) {
      const model = explorerModel(record.buildingId);
      expect(model, record.buildingId).not.toBeNull();
      expect(model!.bands.length).toBe(model!.floorCount ?? 0);
    }
  });

  it("returns null for an unknown block and no bands where there is no count", () => {
    expect(explorerModel("nope")).toBeNull();
    expect(explorerModel("office")!.bands).toHaveLength(0);
    expect(explorerModel("office")!.floorCount).toBeNull();
  });

  it("picks one status per floor from its units", () => {
    const unit = (status: "available" | "booked" | "sold" | "TBD") => ({ id: "x", floor: 0, unitTypeId: "flat-473", status });
    expect(floorStatus(null)).toBe("TBD");
    expect(floorStatus([])).toBe("TBD");
    expect(floorStatus([unit("sold"), unit("booked")])).toBe("booked");
    expect(floorStatus([unit("sold"), unit("available"), unit("booked")])).toBe("available");
    expect(floorStatus([unit("sold")])).toBe("sold");
    expect(floorStatus([unit("TBD")])).toBe("TBD");
  });

  it("names confirmed floors from the ground and estimated levels from one", () => {
    expect(bandLabel(0, false)).toBe("Ground");
    expect(bandLabel(3, false)).toBe("Floor 3");
    expect(bandLabel(0, true)).toBe("Level 1");
  });

  it("sizes the elevation from the block's own length on the plan", () => {
    const widths = plan.buildings.filter((b) => b.typology === "flats").map((b) => massingWidth(b));
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(220);
    expect(Math.max(...widths)).toBeLessThanOrEqual(380);
    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it("writes the enquiry text from what is known", () => {
    expect(unitEnquiryLabel("Block B18", "Level 3", "Typical flat, plan 473")).toBe("Block B18, Level 3, Typical flat, plan 473");
    expect(unitEnquiryLabel("Block B18", null, null)).toBe("Block B18");
  });
});
