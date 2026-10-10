/**
 * Draw plan.json over a render so the trace can be checked by eye.
 *
 *   node --no-warnings tools/images/overlay-plan.mjs --bg <render.png|webp> --out <overlay.png> [--plan src/content/plan/plan.json]
 *        [--scale 1] [--labels ids|tags|plots|none] [--crop x,y,w,h]
 *
 * The background is resized to the 2000 x 1342 grid, so the 4K top-down works too. Output is for review only
 * (never committed): pass an --out path in a scratch folder.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : acc), []),
);
if (!args.bg || !args.out) {
  console.error("usage: overlay-plan.mjs --bg <image> --out <png> [--plan plan.json] [--scale 1] [--labels ids|tags|plots|none] [--crop x,y,w,h]");
  process.exit(1);
}
const plan = JSON.parse(readFileSync(args.plan ?? "src/content/plan/plan.json", "utf8"));
const W = plan.grid.width;
const H = plan.grid.height;
const COLORS = { flats: "#2f7bff", rowhouses: "#ff7a1a", shops: "#14c46b", mixed: "#d63bd6", office: "#ff2b6a", amenity: "#ffd400" };
const d = (poly) => "M" + poly.map((p) => `${p[0]} ${p[1]}`).join("L") + "Z";
const line = (pl) => "M" + pl.map((p) => `${p[0]} ${p[1]}`).join("L");
const centroid = (poly) => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
const labelMode = args.labels ?? "ids";
const text = (x, y, t, size = 14, fill = "#fff") =>
  `<text x="${x}" y="${y}" font-size="${size}" font-family="monospace" fill="${fill}" stroke="#000" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${t}</text>`;

let body = "";
for (const g of plan.gardens) body += `<path d="${d(g.polygon)}" fill="#25d366" fill-opacity="0.22" stroke="#25d366" stroke-width="1.5"/>`;
for (const dist of plan.districts) body += `<path d="${d(dist.polygon)}" fill="#ff7a1a" fill-opacity="0.08" stroke="#ff7a1a" stroke-width="2" stroke-dasharray="10 6"/>`;
for (const r of plan.roads) {
  if (r.polygon) body += `<path d="${d(r.polygon)}" fill="#ff3030" fill-opacity="0.25" stroke="#ff3030" stroke-width="1"/>`;
  body += `<path d="${line(r.centerline)}" fill="none" stroke="#ff3030" stroke-width="2" stroke-dasharray="8 5"/>`;
}
for (const b of plan.buildings) {
  const c = COLORS[b.typology] ?? "#fff";
  body += `<path d="${d(b.polygon)}" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="2"/>`;
  if (labelMode !== "none" && labelMode !== "plots") {
    const [x, y] = centroid(b.polygon);
    body += text(x, y, labelMode === "tags" ? (b.sheetTag === "TBD" ? "" : b.sheetTag) : b.id, 13);
  }
}
for (const a of plan.amenities) {
  if (a.polygon) body += `<path d="${d(a.polygon)}" fill="#ffd400" fill-opacity="0.15" stroke="#ffd400" stroke-width="2"/>`;
  else body += `<circle cx="${a.point[0]}" cy="${a.point[1]}" r="6" fill="#ffd400" stroke="#000"/>`;
}
for (const p of plan.plots) {
  const low = p.numberConfidence === "low";
  body += `<path d="${d(p.polygon)}" fill="none" stroke="${low ? "#ffb3b3" : "#ffffff"}" stroke-width="0.8"/>`;
  if (labelMode === "plots") {
    const [x, y] = centroid(p.polygon);
    body += text(x, y, p.number, 7, low ? "#ffb3b3" : "#fff");
  }
}
body += `<circle cx="${plan.roundabout.center[0]}" cy="${plan.roundabout.center[1]}" r="${plan.roundabout.radius}" fill="none" stroke="#ff3030" stroke-width="3"/>`;
for (const e of plan.entries) body += `<circle cx="${e.point[0]}" cy="${e.point[1]}" r="9" fill="#ff3030" stroke="#fff" stroke-width="2"/>`;
body += `<path d="${d(plan.boundary)}" fill="none" stroke="#00e5ff" stroke-width="3"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
let img = sharp(args.bg).resize(W, H, { fit: "fill" }).composite([{ input: Buffer.from(svg) }]);
let buf = await img.png().toBuffer();
let out = sharp(buf);
if (args.crop) {
  const [x, y, w, h] = args.crop.split(",").map(Number);
  out = out.extract({ left: x, top: y, width: w, height: h });
}
const scale = Number(args.scale ?? 1);
if (scale !== 1) {
  const meta = await sharp(await out.png().toBuffer()).metadata();
  out = sharp(await out.png().toBuffer()).resize(Math.round(meta.width * scale));
}
await out.png().toFile(args.out);
console.log("wrote", args.out);
