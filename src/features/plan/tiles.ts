/**
 * Reality-lens tile maths. Pure and DOM free.
 *
 * `public/plan/tiles/manifest.json` describes the deep-zoom pyramid of the photoreal top-down render. A grid point
 * (gx, gy) is pixel (gx * gridToPx, gy * gridToPx) of a level, so a tile's place on the plan is its pixel rectangle
 * divided by gridToPx: alignment with the line drawing is exact and no coordinates live in components.
 */
import manifestJson from "../../../public/plan/tiles/manifest.json";
import type { Box } from "./camera";

export interface TileLevel {
  z: number;
  width: number;
  height: number;
  cols: number;
  rows: number;
  gridToPx: number;
}

export interface TileManifest {
  tileSize: number;
  template: string;
  maxZ: number;
  levels: readonly TileLevel[];
}

export const tileManifest: TileManifest = manifestJson as TileManifest;

export interface TileRef {
  z: number;
  x: number;
  y: number;
  key: string;
  href: string;
  /** Position and size on the render grid. */
  rect: Box;
}

export function tileHref(manifest: TileManifest, z: number, x: number, y: number): string {
  return manifest.template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

export function levelAt(manifest: TileManifest, z: number): TileLevel {
  return manifest.levels.find((level) => level.z === z) ?? manifest.levels[manifest.levels.length - 1];
}

export interface LevelChoice {
  /** Device pixel ratio to honour (1 on Tier B, up to 2 on Tier A). */
  dpr: number;
  /** Highest level to use: lower levels on Tier B and Tier C. */
  maxZ: number;
}

/** The sharpest level that is still needed: the first whose pixels per grid unit cover the screen's, up to the cap. */
export function chooseTileLevel(manifest: TileManifest, screenPxPerGrid: number, choice: LevelChoice): TileLevel {
  const wanted = screenPxPerGrid * Math.max(choice.dpr, 1);
  const allowed = manifest.levels.filter((level) => level.z <= choice.maxZ);
  const pool = allowed.length > 0 ? allowed : manifest.levels.slice(0, 1);
  return pool.find((level) => level.gridToPx >= wanted) ?? pool[pool.length - 1];
}

/** Where tile (x, y) of `level` sits on the grid. Edge tiles keep their true, smaller size. */
export function tileRect(manifest: TileManifest, level: TileLevel, x: number, y: number): Box {
  const left = x * manifest.tileSize;
  const top = y * manifest.tileSize;
  const w = Math.min(manifest.tileSize, level.width - left);
  const h = Math.min(manifest.tileSize, level.height - top);
  return [left / level.gridToPx, top / level.gridToPx, w / level.gridToPx, h / level.gridToPx];
}

/** The tiles of `level` that touch `box` (grid units). */
export function tilesForBox(manifest: TileManifest, level: TileLevel, box: Box): TileRef[] {
  const toTile = (grid: number) => Math.floor((grid * level.gridToPx) / manifest.tileSize);
  const x0 = Math.max(0, toTile(box[0]));
  const y0 = Math.max(0, toTile(box[1]));
  const x1 = Math.min(level.cols - 1, toTile(box[0] + box[2]));
  const y1 = Math.min(level.rows - 1, toTile(box[1] + box[3]));
  const tiles: TileRef[] = [];
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      tiles.push({ z: level.z, x, y, key: `${level.z}/${x}_${y}`, href: tileHref(manifest, level.z, x, y), rect: tileRect(manifest, level, x, y) });
    }
  }
  return tiles;
}

/** The box a lens of `radius` (grid units) centred on (gx, gy) covers. */
export function lensBox(gx: number, gy: number, radius: number): Box {
  return [gx - radius, gy - radius, radius * 2, radius * 2];
}
