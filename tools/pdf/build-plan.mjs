/**
 * Build src/content/plan/plan.json (version 1) and validate it with planSchema.
 *
 *   node --no-warnings tools/pdf/build-plan.mjs
 *
 * Inputs (all committed, see docs/DATA_NOTES.md for how each was made):
 *   tools/pdf/data/traced-geometry.json   Darshit's traced geometry on the 2000 x 1342 render grid (boundary, roads, lawns, row-house strips)
 *   tools/pdf/data/cad-footprints.json    building footprints cut from the 2022 CAD sheet (CAD display points) with sheet tags
 *   tools/pdf/data/cad-points.json        court entries, cabins and the row-house entry read from the CAD sheet
 *   tools/pdf/data/rowhouse-plots.json    165 numbered plots on the traced strips
 *   src/content/plan/transform.json       CAD display points to the render grid
 * Output: src/content/plan/plan.json
 *
 * Where a feature sits: buildings are drawn where their roofs are seen in the render (CAD footprints go through the
 * fitted transform); roads, lawns, gardens and the roundabout are the traced, render-registered shapes. All geometry is
 * on the render grid, y down.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { planSchema } from "../../src/content/schema.ts";
import { clipPolygonMaxX, offsetPolyline, roundedRectPolygon } from "./lib/geom.mjs";
import { stringifyCompact } from "./lib/json.mjs";
import { centroid, ellipsePolygon, parsePoints, roundPoint, samplePath } from "./lib/svgpath.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const readJson = (...parts) => JSON.parse(readFileSync(join(...parts), "utf8"));
const traced = readJson(here, "data", "traced-geometry.json");
const cad = readJson(here, "data", "cad-footprints.json");
const cadPoints = readJson(here, "data", "cad-points.json");
const rowhousePlots = readJson(here, "data", "rowhouse-plots.json");
const transform = readJson(root, "src", "content", "plan", "transform.json");

const [ta, tb, tc, td, te, tf] = transform.matrix;
const toGrid = ([x, y]) => [ta * x + tc * y + te, tb * x + td * y + tf];
const r1 = (poly) => poly.map((p) => roundPoint(p, 1));
const pad = (n) => String(n).padStart(2, "0");
const FT = 0.3048;
const feetToM = (ft) => Math.round(ft * FT * 100) / 100;
const dedupe = (poly) => poly.filter((p, i) => i === 0 || p[0] !== poly[i - 1][0] || p[1] !== poly[i - 1][1]);

/* ------------------------------------------------------------------------------------------------ */
/* Boundary, roundabout, district                                                                    */
/* ------------------------------------------------------------------------------------------------ */
const boundary = r1(samplePath(traced.PJ_BOUND)[0]);
const ROUNDABOUT = { center: [1320, 651], radius: 30 };
const ROWHOUSE_ENTRY_X = 771; // the district starts west of the entry (first strips end at x = 765)

/* ------------------------------------------------------------------------------------------------ */
/* Roads                                                                                             */
/* ------------------------------------------------------------------------------------------------ */
const highway = samplePath(traced.PJ_MAIN, 24)[0].filter((p) => p[1] >= -60 && p[1] <= 1400);
const road = ({ id, name, label, widthM, line, drawPx, isPublic = false, polygon = true }) => ({
  id,
  name,
  widthLabel: label,
  widthM,
  centerline: r1(line),
  ...(polygon && drawPx ? { polygon: r1(offsetPolyline(line, drawPx / 2)) } : {}),
  public: isPublic,
});
const roads = [
  road({ id: "vapi-silvassa-road", name: "Vapi-Silvassa Road", label: "9.00 MT", widthM: 9, line: highway, drawPx: 70, isPublic: true }),
  road({ id: "boulevard-40ft", name: "Entry boulevard", label: `40'0"`, widthM: feetToM(40), line: samplePath(traced.PJ_ROADS[1][0])[0], drawPx: 70 }),
  road({ id: "spine-30ft", name: "Spine road", label: `30'0"`, widthM: feetToM(30), line: samplePath(traced.PJ_ROADS[0][0])[0], drawPx: 34 }),
  road({ id: "diagonal-40ft", name: "Diagonal internal road", label: `40'0"`, widthM: feetToM(40), line: samplePath(traced.PJ_ROADS[2][0], 24)[0], drawPx: 40 }),
  road({ id: "north-road-20ft", name: "20 ft road from the roundabout", label: `20'0"`, widthM: feetToM(20), line: samplePath(traced.PJ_ROADS[3][0])[0], drawPx: 24 }),
  // lanes between the row-house blocks: x is the middle of the gap between the traced strips
  road({ id: "lane-25ft-plots-1-11", name: "25 ft road beside plots 1 to 11", label: `25'0"`, widthM: feetToM(25), line: [[705, 668], [705, 957]], drawPx: 26 }),
  road({ id: "lane-20ft-north-2", name: "20 ft road between north blocks 2 and 3", label: `20'0"`, widthM: feetToM(20), line: [[576, 668], [576, 882]], drawPx: 18 }),
  road({ id: "lane-20ft-north-3", name: "20 ft road between north blocks 3 and 4", label: `20'0"`, widthM: feetToM(20), line: [[450, 668], [450, 835]], drawPx: 10 }),
  road({ id: "lane-30ft-garden", name: "30 ft road beside the linear garden", label: `30'0"`, widthM: feetToM(30), line: [[336, 668], [336, 805]], drawPx: 30 }),
  road({ id: "lane-20ft-south-1", name: "20 ft road beside plots 155 to 165", label: `20'0"`, widthM: feetToM(20), line: [[714, 375], [714, 650]], drawPx: 18 }),
  // lanes hidden between facing decks in the render: centre lines only
  road({ id: "lane-20ft-south-2", name: "20 ft road between south blocks 2 and 3", label: `20'0"`, widthM: feetToM(20), line: [[599, 480], [599, 650]], polygon: false }),
  road({ id: "lane-20ft-south-3", name: "20 ft road between south blocks 3 and 4", label: `20'0"`, widthM: feetToM(20), line: [[494.5, 500], [494.5, 650]], polygon: false }),
  road({ id: "lane-20ft-south-4", name: "20 ft road between south blocks 4 and 5", label: `20'0"`, widthM: feetToM(20), line: [[384, 515], [384, 650]], polygon: false }),
];

/* ------------------------------------------------------------------------------------------------ */
/* Entries                                                                                           */
/* ------------------------------------------------------------------------------------------------ */
const entries = [
  { id: "main-entry", point: [1892, 652], kind: "main", label: "Main entry" },
  { id: "rowhouse-entry", point: roundPoint(toGrid(cadPoints.rowhouseEntry.cad), 1), kind: "rowhouse", label: "Row-house entry" },
  ...cadPoints.courtEntries.map((e) => ({
    id: e.id,
    point: roundPoint(toGrid(e.cad), 1),
    kind: "court",
    label: `Court entry, sector ${e.sector}`,
  })),
];

/* ------------------------------------------------------------------------------------------------ */
/* Buildings                                                                                         */
/* ------------------------------------------------------------------------------------------------ */
// Sector is only given where the SECTOR label sits inside the court the block surrounds.
const SECTOR_OF_TAG = {
  B1: "01", B2: "01",
  B9: "02", B10: "02", B11: "02", B12: "02",
  B13: "03", B14: "03", B15: "03", B16: "03", B17: "03", B18: "03", B19: "03",
  C1: "04", C2: "04", C3: "04", C4: "04", C5: "04",
  C8: "05", C9: "05", C10: "05", C11: "05", C12: "05", C13: "05",
};
// Confirmed by Darshit (DECISIONS 2026-10-11): flat blocks, the mixed-use building and shops block A are ground + 5
// (Ground, 1st to 5th = 6 levels) with a roof terrace above; row houses are ground + 1 (2 storeys) with a roof terrace.
const FLOORS_BLOCKS = 6;
const FLOORS_ROWHOUSES = 2;

function sectorOf(tags) {
  const sectors = new Set(tags.map((t) => SECTOR_OF_TAG[t] ?? "TBD"));
  return sectors.size === 1 ? [...sectors][0] : "TBD";
}

const buildings = [];
for (const b of cad.buildings) {
  const polygon = r1(dedupe(b.polygonCad.map(toGrid)));
  if (b.fromTrace) {
    const newTag = b.newTag;
    buildings.push({
      id: `${newTag.toLowerCase()}-tilted-slabs`,
      sheetTag: "TBD",
      newTag,
      sector: "TBD",
      typology: "flats",
      floors: FLOORS_BLOCKS,
      polygon,
      label: `Pair of tilted slabs at the top of sector 05 (tag ${newTag} on the newer sheet, not on the 2022 sheet)`,
      indicative: true,
    });
    continue;
  }
  const tags = b.tags;
  const sheetTag = tags.join("/");
  const base = { sheetTag, sector: sectorOf(tags), floors: "TBD", polygon, indicative: false };
  if (b.kind === "shops") {
    buildings.push({ id: "shops-a", ...base, sector: "TBD", typology: "shops", floors: FLOORS_BLOCKS, label: "Shops block A" });
  } else if (b.kind === "office") {
    buildings.push({ id: "office", ...base, sheetTag: "BLDG", sector: "TBD", typology: "office", label: "Parshwanath Infra site office" });
  } else if (b.kind === "mixed") {
    buildings.push({
      id: tags.map((t) => t.toLowerCase()).join("-"),
      ...base,
      typology: "mixed",
      floors: FLOORS_BLOCKS,
      label: `Mixed-use building ${sheetTag}, commercial and residential`,
    });
  } else {
    buildings.push({
      id: tags.map((t) => t.toLowerCase()).join("-"),
      ...base,
      typology: "flats",
      floors: FLOORS_BLOCKS,
      label: `Block ${sheetTag}`,
    });
  }
}
// row houses: the traced strips and the four tilted slabs at the tip (render outlines, indicative)
traced.PJ_B.rows.forEach((s, i) => {
  const tip = i >= 15;
  buildings.push({
    id: tip ? `rh-tip-${pad(i - 14)}` : `rh-strip-${pad(i + 1)}`,
    sheetTag: "TBD",
    sector: "TBD",
    typology: "rowhouses",
    floors: FLOORS_ROWHOUSES,
    polygon: r1(parsePoints(s)),
    label: tip ? `Row-house slab ${i - 14} at the tip` : `Row-house strip ${i + 1}`,
    indicative: true,
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* Gardens and amenities                                                                             */
/* ------------------------------------------------------------------------------------------------ */
const am = traced.PJ_AMENITY;
const lawn = traced.PJ_LAWNS;
const rect = (item) => roundedRectPolygon(item);
const gardens = [
  { id: "garden-court-sector-01", name: "Garden court, sector 01", polygon: r1(rect(am[4])) },
  { id: "garden-court-sector-03", name: "Garden in the sector 03 court", polygon: r1(ellipsePolygon(lawn[2])) },
  { id: "garden-court-sector-05", name: "Garden with the looping path, sector 05 court", polygon: r1(ellipsePolygon(lawn[0])) },
  { id: "garden-linear-04-05", name: "Linear garden between sectors 04 and 05", polygon: r1(rect(am[5])) },
  { id: "garden-triangle-sector-03", name: "Triangular garden beside the diagonal road, sector 03", polygon: r1(parsePoints(am[7])) },
  { id: "garden-triangle-b5-b6", name: "Triangular garden beside blocks B5 and B6", polygon: r1(parsePoints(am[8])) },
  { id: "garden-beside-b20-b21", name: "Garden beside blocks B20 and B21", polygon: r1(ellipsePolygon(lawn[1])) },
  { id: "lawn-tip", name: "Open lawn at the tip", polygon: r1(parsePoints(lawn[4])) },
  { id: "green-belt-tip", name: "Green belt at the tip", polygon: r1(parsePoints(lawn[5])) },
  { id: "garden-linear-rowhouses", name: "Linear garden with a water feature, row-house district", polygon: r1(parsePoints(lawn[6])) },
  { id: "lawn-office-plot", name: "Lawn of the office plot", polygon: r1(parsePoints(lawn[7])) },
];

const amenity = (id, name, kind, polygon, evidence, labelTbd = false, point = null) => ({
  id,
  name,
  kind,
  point: roundPoint(point ?? centroid(polygon), 1),
  ...(polygon ? { polygon: r1(polygon) } : {}),
  evidence,
  labelTbd,
});
const cabinSector = (c) => `Security cabin at the sector ${c.sector} court entry`;
const amenities = [
  amenity("roundabout-sculpture", "Entry roundabout with a sculpture", "sculpture", ellipsePolygon([ROUNDABOUT.center[0], ROUNDABOUT.center[1], 19, 19], 24), "plan-and-render", false, ROUNDABOUT.center),
  amenity("main-entry-cabin", "Security cabin at the main entry", "security", rect(am[3]), "plan-and-render"),
  ...cadPoints.courtCabins.map((c) => amenity(c.id, cabinSector(c), "security", null, "plan", false, toGrid(c.cad))),
  amenity("garden-courts", "Garden court, sector 01", "garden", rect(am[4]), "plan-and-render"),
  amenity("linear-garden", "Linear garden between sectors 04 and 05", "garden", rect(am[5]), "plan-and-render"),
  amenity("playground-sector-03", "Playground in the sector 03 court", "playground", ellipsePolygon(lawn[3]), "plan-and-render"),
  amenity("playground-sector-05", "Playground in the sector 05 court", "playground", rect(am[1]), "plan-and-render"),
  amenity("clubhouse-sector-05", "Clubhouse in the sector 05 court", "clubhouse", rect(am[2]), "plan-and-render"),
  amenity("building-sector-04-court", "Building in the sector 04 court (label TBD)", "other", rect(am[0]), "plan-and-render", true),
  amenity("fountain-rowhouse-garden", "Water feature at the end of the row-house linear garden", "fountain", rect(am[6]), "plan"),
  // The three items at the tip are read from the photo of the newer sheet; positions are approximate (about 30 px).
  amenity("tip-building", "Building on a paved plaza at the tip (clubhouse or temple, label TBD)", "other", null, "plan", true, [200, 587]),
  amenity("tip-play-area", "Play area at the tip", "playground", null, "plan", false, [140, 590]),
  amenity("tip-round-feature", "Round feature on the tip lawn (gazebo or water feature, label TBD)", "other", null, "render", true, [240, 614]),
];

/* ------------------------------------------------------------------------------------------------ */
/* Plots and district                                                                                */
/* ------------------------------------------------------------------------------------------------ */
const plots = rowhousePlots.plots.map((p) => ({
  number: p.number,
  numberConfidence: p.source === "cad" ? "high" : "low",
  strip: p.strip,
  polygon: p.polygon,
  type: "TBD",
  status: "TBD",
  indicative: true,
}));
const districts = [
  {
    id: "row-houses",
    name: "Row houses, indicative as per the current layout plan",
    polygon: r1(clipPolygonMaxX(boundary, ROWHOUSE_ENTRY_X)),
    indicative: true,
  },
];

const plan = {
  version: "1.0.0",
  notes: [
    "Buildings in sectors 01 to 05, shops block A and the office are cut from the 2022 CAD sheet and placed with transform.json, so they sit on the roofs seen in the render (20 control points, rms 2.5 px). Roads, lawns, the roundabout and the boundary are Darshit's render-registered traces.",
    "A building can carry several sheet tags (B3/B4, C8/C9/C10): the tags mark stair cores of one continuous block. Sectors are given only where the SECTOR label sits inside the court the block surrounds.",
    "The tilted slab pair at the top of sector 05 (tag Q1) is on the newer printed sheet and in the render but not on the 2022 sheet: it keeps its traced outline.",
    "Row houses: plots 1 to 20 and 144 to 165 are on the 2022 sheet and keep numberConfidence high. The other 123 plots were read from a low-resolution phone photo of the newer sheet (numbers are consistent: three serpentine runs of 52, 56 and 57 plots) and are cut equally along the traced strips: numberConfidence low, geometry indicative.",
    "Floors (confirmed by Darshit): flat blocks, the mixed-use building and shops block A are ground + 5 (6 levels: Ground, 1st to 5th) with a roof terrace above; row houses are ground + 1 (2 storeys) with a roof terrace at the 3rd level. The office floor count is TBD. Units per floor are TBD.",
    "metresPerPx comes from transform.json (the dimension lines of the CAD sheet through the fitted transform); every metre value is indicative. The 9.00 MT width of the Vapi-Silvassa Road is as written on the sheet; whether it is the highway or a service lane is unconfirmed.",
    "Positions of the three tip amenities (building on a plaza, play area, round feature) are approximate; the label of the building is TBD (clubhouse or temple).",
    "northDeg 180: the render is the 2022 sheet turned 180 degrees and the sheet compass points up the paper (SOURCE_PACK section 3).",
  ],
  grid: { width: 2000, height: 1342, viewBox: [0, 150, 2000, 1100] },
  metresPerPx: transform.metresPerRenderPx,
  northDeg: 180,
  boundary,
  roads,
  roundabout: ROUNDABOUT,
  entries,
  gardens,
  districts,
  buildings,
  plots,
  amenities,
};

const parsed = planSchema.parse(plan);
const outDir = join(root, "src", "content", "plan");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "plan.json"), stringifyCompact(parsed, { perLine: 5 }));
const counts = Object.fromEntries(["flats", "mixed", "shops", "office", "rowhouses", "amenity"].map((t) => [t, parsed.buildings.filter((b) => b.typology === t).length]));
console.log(
  `plan.json v${parsed.version}: ${parsed.buildings.length} buildings ${JSON.stringify(counts)}, ${parsed.plots.length} plots, ${parsed.roads.length} roads, ${parsed.gardens.length} gardens, ${parsed.amenities.length} amenities, ${parsed.entries.length} entries`,
);
