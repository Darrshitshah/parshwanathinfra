/**
 * Deep-zoom tiles of the 4K top-down render for the Living Plan's reality lens.
 *
 *   node --no-warnings tools/images/build-tiles.mjs --src "<SS-02 Masterplan Top-Down - hiranandani.png>" [--quality 72]
 *
 * Output: public/plan/tiles/{z}/{x}_{y}.webp (256 px tiles, edge tiles keep their true size) and public/plan/tiles/manifest.json.
 * Level z has width = fullWidth / 2^(maxZ - z); the 4K master is the top level. The image has the same aspect as the
 * render grid (2000 x 1342), so a grid point (gx, gy) is pixel (gx * levelWidth / 2000, gy * levelHeight / 1342) of a level;
 * overlay alignment against the 2000 x 1342 grid was checked by phase correlation (shift 0 px in five regions) and by eye.
 * The master itself is never copied into the repo.
 */
import { mkdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
if (!args.src) {
  console.error('usage: build-tiles.mjs --src "<4K top-down png>" [--quality 72] [--levels 4]');
  process.exit(1);
}
const TILE = 256;
const QUALITY = Number(args.quality ?? 72);
const LEVELS = Number(args.levels ?? 4);
const GRID = { width: 2000, height: 1342 };
const outDir = join(root, "public", "plan", "tiles");

sharp.cache(false);
const meta = await sharp(args.src, { limitInputPixels: false }).metadata();
const { width: fullW, height: fullH } = meta;
if (existsSync(outDir)) rmSync(outDir, { recursive: true });
const levels = [];
let bytes = 0;
let files = 0;

for (let z = 0; z < LEVELS; z += 1) {
  const factor = 2 ** (LEVELS - 1 - z);
  const w = Math.round(fullW / factor);
  const h = Math.round(fullH / factor);
  const level = await sharp(args.src, { limitInputPixels: false }).resize(w, h, { kernel: "lanczos3" }).toBuffer();
  const cols = Math.ceil(w / TILE);
  const rows = Math.ceil(h / TILE);
  mkdirSync(join(outDir, String(z)), { recursive: true });
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const left = x * TILE;
      const top = y * TILE;
      const file = join(outDir, String(z), `${x}_${y}.webp`);
      await sharp(level)
        .extract({ left, top, width: Math.min(TILE, w - left), height: Math.min(TILE, h - top) })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(file);
      bytes += statSync(file).size;
      files += 1;
    }
  }
  levels.push({ z, width: w, height: h, cols, rows, gridToPx: w / GRID.width });
}

const manifest = {
  note: "Deep-zoom tiles of the photoreal top-down render (artist's impression). Grid point (gx, gy) is pixel (gx * gridToPx, gy * gridToPx) of a level.",
  tileSize: TILE,
  format: "webp",
  template: "/plan/tiles/{z}/{x}_{y}.webp",
  grid: GRID,
  full: { width: fullW, height: fullH },
  maxZ: LEVELS - 1,
  levels,
};
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`${files} tiles, ${(bytes / 1048576).toFixed(2)} MB, quality ${QUALITY}, levels ${levels.map((l) => `${l.width}x${l.height}`).join(" ")}`);
