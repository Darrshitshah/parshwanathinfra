import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasForbiddenDash, isTbd } from "../schema";
import { getUnitType, unitTypes } from "./index";

const root = process.cwd();
const cut = JSON.parse(readFileSync(join(root, "tools", "pdf", "data", "unit-rooms.json"), "utf8")) as Record<
  string,
  { sheetLabel: string | null; rooms: { name: string; width: string; length: string; widthM: number; lengthM: number }[] }
>;

describe("unit types", () => {
  it("has the typical flat (label 473) and the larger plan, with area and BHK still TBD", () => {
    expect(unitTypes.map((unit) => unit.id)).toEqual(["flat-473", "flat-large"]);
    expect(getUnitType("flat-473")?.sheetLabel).toBe("473");
    expect(getUnitType("nope")).toBeUndefined();
    for (const unit of unitTypes) {
      expect(unit.bhk).toBe("TBD");
      expect(unit.areaType).toBe("TBD");
      expect(isTbd(unit.areaSqft)).toBe(true);
      expect(unit.indicative).toBe(true);
    }
  });

  it("matches the rooms cut from the sheet, in size and in metres", () => {
    for (const unit of unitTypes) {
      const drawn = cut[unit.id].rooms;
      expect(unit.rooms.length, unit.id).toBe(drawn.length);
      for (const room of drawn) {
        const match = unit.rooms.find((r) => r.width === room.width && r.length === room.length);
        expect(match, `${unit.id} ${room.name}`).toBeDefined();
        expect(match?.widthM).toBeCloseTo(room.widthM, 2);
        expect(match?.lengthM).toBeCloseTo(room.lengthM, 2);
      }
    }
  });

  it("points at plan SVGs that exist, with room labels, no inline colours and no title block", () => {
    for (const unit of unitTypes) {
      expect(isTbd(unit.planSvg)).toBe(false);
      const file = join(root, "public", String(unit.planSvg));
      expect(existsSync(file), String(unit.planSvg)).toBe(true);
      const svg = readFileSync(file, "utf8");
      for (const room of unit.rooms) expect(svg, room.name).toContain(`${room.width}X${room.length}`.replaceAll('"', "&quot;"));
      expect(svg).toContain("u-wall");
      expect(svg).not.toMatch(/\sstyle=|#[0-9a-fA-F]{3,8}\b|<script|<image/);
      expect(svg).not.toMatch(/AUTODESK|PRODUCED BY|\.dwg/i);
      expect(hasForbiddenDash(svg)).toBe(false);
      expect(svg.length).toBeLessThan(40 * 1024);
    }
  });
});
