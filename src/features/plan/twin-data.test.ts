import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";
import { amenityRows, buildingRows, plotRows, plotStatus, zoneRows } from "./twin-data";

describe("accessible twin data", () => {
  it("lists every building, plot and amenity of the plan", () => {
    expect(buildingRows()).toHaveLength(plan.buildings.length);
    expect(plotRows()).toHaveLength(165);
    expect(amenityRows()).toHaveLength(plan.amenities.length);
    expect(plotRows().map((p) => p.number)).toEqual(Array.from({ length: 165 }, (_, i) => i + 1));
  });

  it("keeps floors TBD and marks the indicative estimate as such", () => {
    const rows = buildingRows();
    const block = rows.find((row) => row.id === "b18");
    expect(block).toMatchObject({ floors: "TBD", floorsIndicative: true, explorable: true });
    expect(rows.find((row) => row.id === "office")).toMatchObject({ floors: "TBD", floorsIndicative: false, explorable: false });
    expect(rows.find((row) => row.id === "shops-a")?.explorable).toBe(false);
  });

  it("flags the plots read from the photo and leaves type and status TBD", () => {
    const rows = plotRows();
    expect(rows.filter((row) => row.lowConfidence)).toHaveLength(123);
    expect(rows.every((row) => row.type === "TBD" && row.status === "TBD")).toBe(true);
    expect(plotStatus(7)).toBe("TBD");
  });

  it("groups buildings into sectors, the row-house district and the unassigned rest", () => {
    const zones = zoneRows();
    expect(zones.map((z) => z.name)).toEqual(
      expect.arrayContaining(["Sector 01", "Sector 02", "Sector 03", "Sector 04", "Sector 05", "Sector not stated on the plan"]),
    );
    const district = zones.find((z) => z.id.startsWith("district-"));
    expect(district?.plots).toBe(165);
    const counted = zones.filter((z) => !z.id.startsWith("district-")).reduce((sum, z) => sum + z.buildings, 0);
    expect(counted).toBe(plan.buildings.filter((b) => b.typology !== "rowhouses").length);
  });
});
