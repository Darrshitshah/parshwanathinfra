/**
 * Generate the light web plan SVG from plan.json.
 *
 *   node --no-warnings tools/pdf/build-plan-svg.mjs
 *
 * Output: public/plan/shiv-shiva-plan.svg (run through svgo with ids kept). viewBox is the plan's default crop of the
 * render grid (0 150 2000 1100), so a footprint sits where the building sits in the render. Structure:
 *   #district, #gardens, #roads, #boundary, #typology-flats / -mixed / -shops / -office / -rowhouses,
 *   #plots, #amenities, #entries, #roundabout.
 * Every building has id "b-<id>", every plot "plot-<n>", roads "road-<id>", gardens "g-<id>", amenities
 * "a-<id>", entries "e-<id>", districts "district-<id>". Strokes carry vector-effect="non-scaling-stroke"; there are no colours in the file:
 * style it with the classes (plan-building t-flats, plan-plot, plan-road ...) and currentColor from the page tokens.
 * The CAD sheet, its title block and any raw drawing are never included.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const plan = JSON.parse(readFileSync(join(root, "src", "content", "plan", "plan.json"), "utf8"));

const num = (v) => String(Math.round(v * 10) / 10);
const pathOf = (poly, close = true) => "M" + poly.map((p) => `${num(p[0])} ${num(p[1])}`).join("L") + (close ? "Z" : "");
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const NS = 'vector-effect="non-scaling-stroke"';

const out = [];
const [vx, vy, vw, vh] = plan.grid.viewBox;
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round">`);

for (const d of plan.districts) {
  out.push(`<g id="districts"><path id="district-${d.id}" class="plan-district" fill="none" ${NS} d="${pathOf(d.polygon)}"/></g>`);
}

out.push('<g id="gardens" stroke="none">');
for (const g of plan.gardens) out.push(`<path id="g-${g.id}" class="plan-garden" d="${pathOf(g.polygon)}"/>`);
out.push("</g>");

out.push('<g id="roads">');
for (const r of plan.roads) {
  if (r.polygon) {
    out.push(`<path id="road-${r.id}" class="plan-road${r.public ? " plan-road-public" : ""}" data-width="${esc(r.widthLabel)}" stroke="none" d="${pathOf(r.polygon)}"/>`);
  } else {
    out.push(`<path id="road-${r.id}" class="plan-lane" data-width="${esc(r.widthLabel)}" fill="none" ${NS} d="${pathOf(r.centerline, false)}"/>`);
  }
}
out.push("</g>");

out.push(`<path id="boundary" class="plan-boundary" fill="none" ${NS} d="${pathOf(plan.boundary)}"/>`);

const TYPOLOGIES = ["flats", "mixed", "shops", "office", "rowhouses"];
for (const t of TYPOLOGIES) {
  const items = plan.buildings.filter((b) => b.typology === t);
  if (items.length === 0) continue;
  out.push(`<g id="typology-${t}" class="plan-typology" data-t="${t}">`);
  for (const b of items) {
    const tag = b.sheetTag !== "TBD" ? ` data-tag="${esc(b.sheetTag)}"` : "";
    out.push(`<path id="b-${b.id}" class="plan-building t-${t}${b.indicative ? " is-indicative" : ""}" data-t="${t}"${tag} fill-opacity="0.16" ${NS} d="${pathOf(b.polygon)}"/>`);
  }
  out.push("</g>");
}

out.push('<g id="plots" fill="none">');
for (const p of plan.plots) {
  out.push(`<path id="plot-${p.number}" class="plan-plot${p.numberConfidence === "low" ? " is-low" : ""}" ${NS} d="${pathOf(p.polygon)}"/>`);
}
out.push("</g>");

out.push('<g id="amenities" fill="none">');
for (const a of plan.amenities) {
  if (a.polygon) out.push(`<path id="a-${a.id}" class="plan-amenity k-${a.kind}${a.labelTbd ? " is-tbd" : ""}" ${NS} d="${pathOf(a.polygon)}"/>`);
  else out.push(`<circle id="a-${a.id}" class="plan-amenity k-${a.kind}${a.labelTbd ? " is-tbd" : ""}" cx="${num(a.point[0])}" cy="${num(a.point[1])}" r="7" ${NS}/>`);
}
out.push("</g>");

out.push('<g id="entries">');
for (const e of plan.entries) out.push(`<circle id="e-${e.id}" class="plan-entry k-${e.kind}" cx="${num(e.point[0])}" cy="${num(e.point[1])}" r="${e.kind === "main" ? 9 : 6}" stroke="none"/>`);
out.push("</g>");

const rb = plan.roundabout;
out.push(`<g id="roundabout" fill="none"><circle class="plan-roundabout" cx="${rb.center[0]}" cy="${rb.center[1]}" r="${rb.radius}" ${NS}/><circle class="plan-roundabout-island" cx="${rb.center[0]}" cy="${rb.center[1]}" r="${Math.round(rb.radius * 0.63)}" ${NS}/></g>`);
out.push("</svg>");

const result = optimize(out.join("\n"), {
  multipass: true,
  floatPrecision: 1,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          mergePaths: false,
          collapseGroups: false,
          convertShapeToPath: false,
        },
      },
    },
  ],
});
if (result.error) throw new Error(result.error);

const dest = join(root, "public", "plan", "shiv-shiva-plan.svg");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, result.data);
const gz = gzipSync(Buffer.from(result.data), { level: 9 }).length;
console.log(
  `public/plan/shiv-shiva-plan.svg: ${(Buffer.byteLength(result.data) / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzipped, ${plan.buildings.length} buildings, ${plan.plots.length} plots`,
);
