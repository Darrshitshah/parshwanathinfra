/**
 * Build src/content/plan/plan.json (version 0.1: Darshit's traced geometry ported to the schema).
 *
 *   node --no-warnings tools/pdf/build-plan.mjs
 *
 * Input : tools/pdf/data/traced-geometry.json (ported by port-traced-geometry.mjs)
 * Output: src/content/plan/plan.json, validated against planSchema (src/content/schema.ts)
 *
 * Later versions of this script merge CAD-derived footprints and the row-house tracing on top of this
 * base (see docs/DATA_NOTES.md). All geometry is on the 2000 x 1342 render grid, y down.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { planSchema } from "../../src/content/schema.ts";
import { stringifyCompact } from "./lib/json.mjs";
import { centroid, ellipsePolygon, parsePoints, rectPolygon, roundPoint, samplePath } from "./lib/svgpath.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const traced = JSON.parse(readFileSync(join(here, "data", "traced-geometry.json"), "utf8"));
const transform = JSON.parse(readFileSync(join(root, "src", "content", "plan", "transform.json"), "utf8"));

const FT = 0.3048;
const round = (poly) => poly.map((p) => roundPoint(p, 1));
const pad = (n) => String(n).padStart(2, "0");

/* ---- boundary ---- */
const boundary = round(samplePath(traced.PJ_BOUND)[0]);

/* ---- roads ---- */
const mainRoad = samplePath(traced.PJ_MAIN, 24)[0].filter((p) => p[1] >= -60 && p[1] <= 1400);
const roads = [
  {
    id: "vapi-silvassa-road",
    name: "Vapi-Silvassa Road",
    widthLabel: '9.00 MT',
    widthM: 9,
    centerline: round(mainRoad),
    public: true,
  },
  {
    id: "boulevard-40ft",
    name: "Entry boulevard",
    widthLabel: `40'0"`,
    widthM: Math.round(40 * FT * 100) / 100,
    centerline: round(samplePath(traced.PJ_ROADS[1][0])[0]),
    public: false,
  },
  {
    id: "spine-30ft",
    name: "Spine road",
    widthLabel: `30'0"`,
    widthM: Math.round(30 * FT * 100) / 100,
    centerline: round(samplePath(traced.PJ_ROADS[0][0])[0]),
    public: false,
  },
  {
    id: "diagonal-40ft",
    name: "Diagonal internal road",
    widthLabel: `40'0"`,
    widthM: Math.round(40 * FT * 100) / 100,
    centerline: round(samplePath(traced.PJ_ROADS[2][0], 24)[0]),
    public: false,
  },
  {
    id: "north-road-20ft",
    name: "20 ft road from the roundabout",
    widthLabel: `20'0"`,
    widthM: Math.round(20 * FT * 100) / 100,
    centerline: round(samplePath(traced.PJ_ROADS[3][0])[0]),
    public: false,
  },
];

/* ---- buildings ---- */
const buildings = [];
traced.PJ_B.rows.forEach((s, i) => {
  const tip = i >= 15;
  buildings.push({
    id: tip ? `rh-tip-${pad(i - 14)}` : `rh-strip-${pad(i + 1)}`,
    sheetTag: "TBD",
    sector: "TBD",
    typology: "rowhouses",
    floors: "TBD",
    floorsIndicative: 2,
    polygon: round(parsePoints(s)),
    label: tip ? `Row-house slab ${i - 14} at the tip` : `Row-house strip ${i + 1}`,
    indicative: true,
  });
});
traced.PJ_B.flats.forEach((s, i) => {
  buildings.push({
    id: `flat-${pad(i + 1)}`,
    sheetTag: "TBD",
    sector: "TBD",
    typology: "flats",
    floors: "TBD",
    polygon: round(parsePoints(s)),
    indicative: true,
  });
});
buildings.push({
  id: "shops-a",
  sheetTag: "A",
  sector: "TBD",
  typology: "shops",
  floors: "TBD",
  polygon: round(parsePoints(traced.PJ_B.shops[0])),
  label: "Shops block A",
  indicative: false,
});
buildings.push({
  id: "mixed-b1b2",
  sheetTag: "B1/B2",
  sector: "01",
  typology: "mixed",
  floors: "TBD",
  polygon: round(parsePoints(traced.PJ_B.mixed[0])),
  label: "Mixed-use building, commercial and residential",
  indicative: false,
});
buildings.push({
  id: "office",
  sheetTag: "BLDG",
  sector: "TBD",
  typology: "office",
  floors: "TBD",
  polygon: rectPolygon(traced.PJ_OFFICE),
  label: "Parshwanath Infra site office",
  indicative: false,
});

/* ---- gardens (traced lawns) ---- */
const gardens = traced.PJ_LAWNS.map((l, i) => ({
  id: `garden-${pad(i + 1)}`,
  polygon: round(typeof l === "string" ? parsePoints(l) : ellipsePolygon(l)),
}));

/* ---- amenities (traced outlines, labels unconfirmed in v0) ---- */
const amenities = traced.PJ_AMENITY.map((a, i) => {
  const polygon =
    typeof a === "string"
      ? parsePoints(a)
      : rectPolygon([a[0], a[1], a[2], a[3]]);
  return {
    id: `traced-outline-${pad(i + 1)}`,
    name: `Traced open-space outline ${i + 1} (label TBD)`,
    kind: "other",
    point: roundPoint(centroid(polygon), 1),
    polygon: round(polygon),
    evidence: "plan-and-render",
    labelTbd: true,
  };
});

const plan = {
  version: "0.1.0",
  notes: [
    "v0: Darshit's traced geometry (portfolio app.js PJ_B, PJ_ROADS, PJ_MAIN, PJ_BOUND, PJ_AMENITY, PJ_OFFICE, PJ_LAWNS) ported to the render grid. Building ids are provisional and are renamed to sheet tags in v1.",
    "metresPerPx comes from transform.json (CAD dimension lines through the fitted transform); treat every metre value as indicative.",
    "Plots 1 to 165 are not placed yet (v1).",
    "northDeg 180: the render is the 2022 sheet turned 180 degrees and the sheet compass points up the paper (SOURCE_PACK section 3).",
  ],
  grid: { width: 2000, height: 1342, viewBox: [0, 150, 2000, 1100] },
  metresPerPx: transform.metresPerRenderPx,
  northDeg: 180,
  boundary,
  roads,
  roundabout: { center: [1320, 651], radius: 30 },
  entries: [{ id: "main-entry", point: [1892, 652], kind: "main", label: "Main entry" }],
  gardens,
  districts: [],
  buildings,
  plots: [],
  amenities,
};

const parsed = planSchema.parse(plan);
const outDir = join(root, "src", "content", "plan");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "plan.json"), stringifyCompact(parsed));
console.log(
  `plan.json v${parsed.version}: ${parsed.buildings.length} buildings, ${parsed.roads.length} roads, ${parsed.gardens.length} gardens, ${parsed.amenities.length} amenities, ${parsed.boundary.length} boundary points`,
);
