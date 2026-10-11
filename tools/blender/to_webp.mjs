/**
 * PNG renders to WebP under a byte budget (owner: scene-lead).
 *   node tools/blender/to_webp.mjs --in <dir> --out <dir> --budget 250000 [--width 1920] [--glob frame-]
 * Drops the quality from 86 in steps of 3 until each file fits the budget (floor 40).
 */
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith("--") ? [...acc, [cur.slice(2), all[i + 1]]] : acc), []));
const { in: inDir, out: outDir, budget = "250000", width, glob = "" } = args;
if (!inDir || !outDir) throw new Error("usage: --in <dir> --out <dir> --budget <bytes>");
await mkdir(outDir, { recursive: true });
const files = (await readdir(inDir)).filter((f) => f.endsWith(".png") && f.startsWith(glob)).sort();
let total = 0;
for (const file of files) {
  const target = path.join(outDir, file.replace(/\.png$/, ".webp"));
  let quality = 86;
  let size = Infinity;
  while (size > Number(budget) && quality >= 40) {
    let pipeline = sharp(path.join(inDir, file));
    if (width) pipeline = pipeline.resize({ width: Number(width) });
    await pipeline.webp({ quality, effort: 6, smartSubsample: true }).toFile(target);
    size = (await stat(target)).size;
    quality -= 3;
  }
  total += size;
  console.log(`${path.basename(target)} ${(size / 1024).toFixed(0)} KB (q${quality + 3})`);
}
console.log(`total ${(total / 1024 / 1024).toFixed(2)} MB, ${files.length} files`);
