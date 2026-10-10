/**
 * Image pipeline: photoreal 4K masters -> ONE compressed master per image in public/media, plus blur
 * placeholders, and a regenerated src/content/media.ts.
 *
 *   node --no-warnings tools/images/build.mjs [--only id1,id2] [--masters "<dir>"] [--no-encode]
 *
 * - Input: the "Hiranandani Style v2" PNGs (about 24 MB each, never copied into the repo) named in
 *   tools/images/media-manifest.mjs. Override the folder with --masters or SHIV_MASTERS.
 * - Output: public/media/<id>.webp, at most 2560 px wide, WebP effort 6. Quality starts at 80 and steps down
 *   (then the width steps down) until the file is under the target (450 KB, hero 350 KB).
 * - next/image makes the smaller widths and AVIF at request time (docs/DECISIONS.md), so no per-width variants.
 * - src/content/media.ts is regenerated and validated with mediaLibrarySchema. Edit the manifest, not media.ts.
 * - With --no-encode (or when a master is missing) the existing public/media file is kept and only the
 *   metadata is refreshed.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { mediaLibrarySchema } from "../../src/content/schema.ts";
import { DEFAULT_TARGET_KB, items, kept, MASTER_SUFFIX, MAX_WIDTH, TARGET_KB } from "./media-manifest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const outDir = join(root, "public", "media");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const mastersDir =
  option("masters") ??
  process.env.SHIV_MASTERS ??
  join(homedir(), "SHIV SHIVA TOWNSHIP", "SHIVA SHIVA IMG", "Photoreal Kit", "Photoreal Output", "Hiranandani Style v2");
const only = option("only")?.split(",");
const noEncode = flag("no-encode");

/** [width, quality] ladder: try each until the file fits the target. */
const LADDER = [
  [MAX_WIDTH, 80],
  [MAX_WIDTH, 76],
  [MAX_WIDTH, 72],
  [MAX_WIDTH, 68],
  [MAX_WIDTH, 64],
  [2304, 70],
  [2304, 64],
  [2048, 70],
  [2048, 64],
  [2048, 58],
];

async function encode(masterPath, destPath, targetBytes) {
  const meta = await sharp(masterPath).metadata();
  let best = null;
  let lastWidth = 0;
  let raw = null;
  for (const [width, quality] of LADDER) {
    const w = Math.min(width, meta.width);
    if (w !== lastWidth) {
      raw = await sharp(masterPath).resize({ width: w, kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
      lastWidth = w;
    }
    const buffer = await sharp(raw.data, { raw: raw.info }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
    best = { buffer, width: w, quality };
    if (buffer.length <= targetBytes) break;
  }
  writeFileSync(destPath, best.buffer);
  return { bytes: best.buffer.length, width: best.width, quality: best.quality, fit: best.buffer.length <= targetBytes };
}

async function describe(file, mime) {
  const meta = await sharp(file).metadata();
  const blur = await sharp(file).resize(16).webp({ quality: 40 }).toBuffer();
  const blurPng = mime === "image/png" ? await sharp(file).resize(16).png().toBuffer() : null;
  return {
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:${blurPng ? "image/png" : "image/webp"};base64,${(blurPng ?? blur).toString("base64")}`,
  };
}

mkdirSync(outDir, { recursive: true });
const library = [];
const report = [];

for (const item of items) {
  const dest = join(outDir, `${item.id}.webp`);
  const masterPath = join(mastersDir, `${item.master}${MASTER_SUFFIX}`);
  const wanted = !only || only.includes(item.id);
  let note = "kept";
  if (wanted && !noEncode) {
    if (existsSync(masterPath)) {
      const target = (TARGET_KB[item.id] ?? DEFAULT_TARGET_KB) * 1024;
      const r = await encode(masterPath, dest, target);
      note = `${r.width}w q${r.quality} ${(r.bytes / 1024).toFixed(0)} KB${r.fit ? "" : " (OVER TARGET)"}`;
    } else if (existsSync(dest)) {
      note = "master missing, kept existing file";
      console.warn(`warning: master not found for ${item.id}: ${masterPath}`);
    } else {
      throw new Error(`No master and no existing file for ${item.id}: ${masterPath}`);
    }
  }
  const d = await describe(dest, "image/webp");
  const bytes = statSync(dest).size;
  report.push(`${item.id.padEnd(34)} ${String(d.width).padStart(4)}x${String(d.height).padEnd(4)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  ${note}`);
  library.push({
    id: item.id,
    kind: item.kind ?? "render",
    src: `/media/${item.id}.webp`,
    width: d.width,
    height: d.height,
    blurDataURL: d.blurDataURL,
    alt: item.alt,
    caption: item.caption,
    artistImpression: true,
    source: `${item.master}${MASTER_SUFFIX} (Hiranandani Style v2)`,
  });
}

for (const k of kept) {
  const file = join(outDir, k.file);
  const mime = k.file.endsWith(".png") ? "image/png" : "image/webp";
  const d = await describe(file, mime);
  library.push({
    id: k.id,
    kind: k.kind,
    src: `/media/${k.file}`,
    width: d.width,
    height: d.height,
    blurDataURL: d.blurDataURL,
    alt: k.alt,
    artistImpression: k.artistImpression,
    source: k.source,
  });
  report.push(`${k.id.padEnd(34)} ${String(d.width).padStart(4)}x${String(d.height).padEnd(4)} ${(statSync(file).size / 1024).toFixed(0).padStart(4)} KB  kept`);
}

const parsed = mediaLibrarySchema.parse(library);
const ts = `/**
 * Media library. Owner: data-lead.
 * GENERATED by tools/images/build.mjs from tools/images/media-manifest.mjs. Edit the manifest and re-run the script;
 * do not edit this file by hand. One compressed master per image (max ${MAX_WIDTH} px wide); next/image derives the
 * smaller widths and AVIF/WebP at request time (docs/DECISIONS.md).
 */
import { mediaLibrarySchema, type Media } from "./schema";

export const media: readonly Media[] = mediaLibrarySchema.parse(${JSON.stringify(parsed, null, 2)});

const byId = new Map(media.map((item) => [item.id, item]));

export function getMedia(id: string): Media {
  const item = byId.get(id);
  if (!item) throw new Error(\`Unknown media id: \${id}\`);
  return item;
}
`;
writeFileSync(join(root, "src", "content", "media.ts"), ts);

const total = parsed.reduce((sum, m) => sum + statSync(join(root, "public", m.src)).size, 0);
console.log(report.join("\n"));
console.log(`\n${parsed.length} images, public/media total ${(total / 1024 / 1024).toFixed(2)} MB`);
