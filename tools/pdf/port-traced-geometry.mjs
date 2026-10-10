/**
 * One-off port of Darshit's traced site-plan geometry (portfolio assets/js/app.js lines 664 to 920) into
 * tools/pdf/data/traced-geometry.json. The portfolio file is read only; this script evaluates just the
 * PJ_* data declarations and writes them as JSON. Coordinates are on the 2000 x 1342 render grid
 * (masterplan-topdown-upload.webp), y down.
 *
 * Usage: node tools/pdf/port-traced-geometry.mjs "<path to portfolio app.js>"
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const appJs = process.argv[2] ?? "/Users/darshit/Darshit's Portfolio/assets/js/app.js";
const lines = readFileSync(appJs, "utf8").split("\n").slice(663, 920);
const text = lines.join("\n");

// Keep only the const declarations we need (PJ_B ... PJ_TREES), in order.
const start = text.indexOf("const PJ_B = {");
const end = text.indexOf("function pjTypes");
if (start < 0 || end < 0) throw new Error("PJ_* block not found: has the portfolio file moved?");
const decls = text.slice(start, end);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  `${decls}\nresult = { PJ_B, PJ_CORES, PJ_ROADS, PJ_MAIN, PJ_BOUND, PJ_AMENITY, PJ_OFFICE, PJ_LAWNS, PJ_TREES };`,
  ctx,
);

const out = {
  _about:
    "Darshit's traced plan geometry, ported verbatim from the portfolio (assets/js/app.js lines 664 to 920). Render grid 2000 x 1342, y down. Polygons are 'x y x y ...' strings as in the source. Do not edit by hand: tools/pdf/build-plan.mjs reads this and the later CAD-derived refinements.",
  ...ctx.result,
};
mkdirSync(join(here, "data"), { recursive: true });
writeFileSync(join(here, "data", "traced-geometry.json"), JSON.stringify(out, null, 1) + "\n");
console.log(
  Object.fromEntries(
    Object.entries(ctx.result).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b.length])) : String(v).length]),
  ),
);
