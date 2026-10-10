import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { plan } from "./index";

const dir = join(process.cwd(), "public", "plan", "tiles");
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as {
  tileSize: number;
  grid: { width: number; height: number };
  full: { width: number; height: number };
  maxZ: number;
  levels: { z: number; width: number; height: number; cols: number; rows: number; gridToPx: number }[];
};
const MAX_BYTES = 12 * 1024 * 1024;

function totalBytes(path: string): number {
  return readdirSync(path, { withFileTypes: true }).reduce(
    (sum, entry) => sum + (entry.isDirectory() ? totalBytes(join(path, entry.name)) : statSync(join(path, entry.name)).size),
    0,
  );
}

describe("reality-lens tiles", () => {
  it("share the plan grid and its aspect ratio", () => {
    expect(manifest.grid).toEqual({ width: plan.grid.width, height: plan.grid.height });
    expect(manifest.full.width / manifest.full.height).toBeCloseTo(plan.grid.width / plan.grid.height, 2);
    expect(manifest.tileSize).toBe(256);
  });

  it("have 3 to 4 levels, each double the last, and a tile file for every cell", () => {
    expect(manifest.levels.length).toBeGreaterThanOrEqual(3);
    expect(manifest.levels.length).toBeLessThanOrEqual(4);
    expect(manifest.maxZ).toBe(manifest.levels.length - 1);
    manifest.levels.forEach((level, index) => {
      if (index > 0) expect(level.width / manifest.levels[index - 1].width).toBeCloseTo(2, 1);
      expect(level.cols).toBe(Math.ceil(level.width / manifest.tileSize));
      expect(level.rows).toBe(Math.ceil(level.height / manifest.tileSize));
      expect(level.gridToPx).toBeCloseTo(level.width / plan.grid.width, 6);
      for (let y = 0; y < level.rows; y += 1) {
        for (let x = 0; x < level.cols; x += 1) {
          expect(existsSync(join(dir, String(level.z), `${x}_${y}.webp`)), `${level.z}/${x}_${y}`).toBe(true);
        }
      }
    });
    expect(manifest.levels[manifest.maxZ]).toMatchObject({ width: manifest.full.width, height: manifest.full.height });
  });

  it("stay under 12 MB in total", () => {
    expect(totalBytes(dir)).toBeLessThan(MAX_BYTES);
  });
});
