import { describe, expect, it } from "vitest";
import { chapters } from "@/content/plan/chapters";
import { parseRef } from "./plan-refs";

describe("plan references", () => {
  it("reads plots and buildings and knows which blocks open the explorer", () => {
    expect(parseRef("plot-42")).toEqual({ kind: "plot", number: 42 });
    expect(parseRef("b-b1-b2")).toEqual({ kind: "building", id: "b1-b2", explorable: true, typology: "mixed" });
    expect(parseRef("b-b18")).toMatchObject({ kind: "building", explorable: true, typology: "flats" });
    expect(parseRef("b-shops-a")).toMatchObject({ kind: "building", explorable: false, typology: "shops" });
    expect(parseRef("b-rh-strip-15")).toMatchObject({ kind: "building", explorable: false, typology: "rowhouses" });
  });

  it("treats anything else as a plain place", () => {
    expect(parseRef("road-spine-30ft")).toEqual({ kind: "other" });
    expect(parseRef("b-nope")).toEqual({ kind: "other" });
    expect(parseRef("plot-x")).toEqual({ kind: "other" });
    expect(parseRef(undefined)).toEqual({ kind: "other" });
  });

  it("every hotspot of every chapter resolves to something the UI can act on", () => {
    for (const chapter of chapters) {
      for (const spot of chapter.hotspots) {
        expect(["plot", "building", "other"]).toContain(parseRef(spot.ref).kind);
        expect(spot.point).toHaveLength(2);
      }
    }
  });
});
