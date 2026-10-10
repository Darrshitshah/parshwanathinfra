import { describe, expect, it } from "vitest";
import { plan } from "@/content/plan";
import { chooseTileLevel, lensBox, tileHref, tileManifest, tileRect, tilesForBox, levelAt } from "./tiles";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("reality-lens tiles", () => {
  it("reads the manifest of the shipped pyramid", () => {
    expect(tileManifest.tileSize).toBe(256);
    expect(tileManifest.levels.map((level) => level.z)).toEqual([0, 1, 2, 3]);
    expect(tileManifest.levels[3].gridToPx).toBeCloseTo(tileManifest.levels[3].width / plan.grid.width, 2);
  });

  it("chooses the level that matches the zoom, capped by the tier", () => {
    const wide = chooseTileLevel(tileManifest, 0.2, { dpr: 1, maxZ: 3 });
    expect(wide.z).toBe(0);
    expect(chooseTileLevel(tileManifest, 0.6, { dpr: 1, maxZ: 3 }).z).toBe(1);
    expect(chooseTileLevel(tileManifest, 1.2, { dpr: 1, maxZ: 3 }).z).toBe(2);
    expect(chooseTileLevel(tileManifest, 2.4, { dpr: 1, maxZ: 3 }).z).toBe(3);
    // never beyond the data
    expect(chooseTileLevel(tileManifest, 50, { dpr: 2, maxZ: 3 }).z).toBe(3);
    // Tier B cap
    expect(chooseTileLevel(tileManifest, 50, { dpr: 1, maxZ: 2 }).z).toBe(2);
    // a retina screen asks for more pixels
    expect(chooseTileLevel(tileManifest, 0.4, { dpr: 2, maxZ: 3 }).z).toBe(2);
  });

  it("places a tile at its pixel rectangle divided by gridToPx, edge tiles smaller", () => {
    const level = levelAt(tileManifest, 3);
    const [x, y, w, h] = tileRect(tileManifest, level, 1, 2);
    expect(x).toBeCloseTo(256 / level.gridToPx);
    expect(y).toBeCloseTo(512 / level.gridToPx);
    expect(w).toBeCloseTo(256 / level.gridToPx);
    expect(h).toBeCloseTo(256 / level.gridToPx);
    const edge = tileRect(tileManifest, level, level.cols - 1, level.rows - 1);
    expect(edge[0] + edge[2]).toBeCloseTo(level.width / level.gridToPx);
    expect(edge[1] + edge[3]).toBeCloseTo(level.height / level.gridToPx);
    expect(edge[2]).toBeLessThanOrEqual(256 / level.gridToPx);
  });

  it("lists only the tiles a lens touches, all of which exist on disk", () => {
    const level = levelAt(tileManifest, 3);
    const tiles = tilesForBox(tileManifest, level, lensBox(1320, 651, 40));
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.length).toBeLessThanOrEqual(4);
    for (const tile of tiles) {
      expect(tile.href).toBe(tileHref(tileManifest, 3, tile.x, tile.y));
      expect(existsSync(join(process.cwd(), "public", tile.href))).toBe(true);
    }
    // the box is inside the union of the tiles
    const minX = Math.min(...tiles.map((tile) => tile.rect[0]));
    const maxX = Math.max(...tiles.map((tile) => tile.rect[0] + tile.rect[2]));
    expect(minX).toBeLessThanOrEqual(1280);
    expect(maxX).toBeGreaterThanOrEqual(1360);
  });

  it("clips boxes at the edges of the pyramid", () => {
    const level = levelAt(tileManifest, 1);
    const all = tilesForBox(tileManifest, level, [-500, -500, 5000, 5000]);
    expect(all).toHaveLength(level.cols * level.rows);
    expect(tilesForBox(tileManifest, level, [-500, -500, 10, 10])).toHaveLength(0);
    expect(tilesForBox(tileManifest, level, [-10, -10, 20, 20])).toHaveLength(1);
  });
});
