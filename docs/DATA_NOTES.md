# Data notes (data-lead)

How each data artefact is made, how to re-make it, and what is still unknown. Everything runs from the project folder
(quote the paths; the folder name ends with a space). Python goes through uv:
`~/.local/bin/uv run --no-project --python 3.12 --with <pkg> python ...`. Nothing from `_source/` is committed.

## Sources (read only)

| Name used below | File |
|---|---|
| `LAYOUT_PDF` | `/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.pdf` (2022 CAD sheet) |
| `PHOTO` | `.../source/layout-plan-photo.jpg` (newer printed sheet, rotate 180 degrees; row-house district) |
| `TOPDOWN_2K` | `.../source/masterplan-topdown-upload.webp` (2000 x 1342, the render grid) |
| `TOPDOWN_4K` | `~/SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/Photoreal Kit/Photoreal Output/Hiranandani Style v2/SS-02 Masterplan Top-Down - hiranandani.png` (5056 x 3392) |

## Pipeline at a glance

```
LAYOUT_PDF --plan_extract.py--> _source/cad/ (labels, layers, tiles; gitignored)
          --fit_transform.py--> src/content/plan/transform.json
          --cad_buildings.py--> tools/pdf/data/cad-footprints.json
          --cut_units.py------> public/plan/units/*.svg + tools/pdf/data/unit-rooms.json
Darshit's app.js --port-traced-geometry.mjs--> tools/pdf/data/traced-geometry.json   (boundary, roads, lawns, strips)
PHOTO + CAD plots --hand-read--> tools/pdf/data/rowhouse-spec.json --rowhouse_plots.py--> rowhouse-plots.json
all of the above --build-plan.mjs--> src/content/plan/plan.json (validated with planSchema)
plan.json --build-plan-svg.mjs--> public/plan/shiv-shiva-plan.svg
TOPDOWN_4K --build-tiles.mjs--> public/plan/tiles/{z}/{x}_{y}.webp + manifest.json
```

`src/content/plan/layers.md` explains which CAD stroke colour is what.

## Re-running when Darshit supplies the updated plan

1. **Updated CAD PDF or DWG-as-PDF:** run `plan_extract.py --pdf <pdf> --out _source/cad --tiles`, then `fit_transform.py`
   (see its docstring for the arguments), `cad_buildings.py`, and adjust `tools/pdf/data/cad-points.json` (court entries and
   cabins), `tag-overrides.json` (tags) and `rowhouse-spec.json` (which strip holds which plots, now exact). Then
   `node --no-warnings tools/pdf/build-plan.mjs` and `node --no-warnings tools/pdf/build-plan-svg.mjs`. The updated sheet should
   replace the traced row-house strips: put real plot polygons into `traced-geometry.json` (or extend `build-plan.mjs`), set
   `numberConfidence` to `"high"` for plots read exactly, and drop `indicative` where it is no longer true.
2. **New top-down render:** keep it at the same framing (same aspect, same crop of the site). Run
   `node --no-warnings tools/images/build-tiles.mjs --src "<new 4K png>"`, then check alignment (below). If the framing
   changed, `plan.json` has to be re-registered to it (`fit_transform.py` then `build-plan.mjs`).
3. **New flat plans:** add a rectangle (sheet display points, centre of the shared walls) to `UNITS` in `cut_units.py`, run it,
   and add `src/content/units/<id>.ts` (copy `flat-473.ts`). `units.test.ts` checks the rooms against `unit-rooms.json`.
4. **Floors, areas, BHK, plot types and status:** edit `plan.json` through `build-plan.mjs` (floors) and `inventory.ts`
   (status). Floors are confirmed (Darshit, 2026-10-11): `floors: 6` for flats, the mixed-use building and shops A, `floors: 2` for row houses (roof terrace above both); the office stays `"TBD"`. `floorsIndicative` is no longer written.
5. Run `npm run typecheck`, `npm run lint`, `npm test`. The tests in `src/content/**` fail loudly if ids, plots, chapters,
   the SVG, the tiles or the media files fall out of step.

## Artefacts

### plan.json and transform.json (render grid 2000 x 1342, y down)
- Buildings in sectors 01 to 05, shops block A and the office are cut from the CAD vectors and mapped by `transform.json`
  (half-turn affine, 1.1407 render px per CAD point, 0.2495 m per render px). Roads, lawns, the roundabout and the boundary
  are Darshit's render-registered traces. 41 buildings, 165 plots, 13 roads (widths in metres from the 9.00 MT, 40', 30', 25'
  and 20' labels), 11 gardens, 17 amenities (each with `evidence`: plan, render or plan-and-render), 7 entries, 1 district.
- Transform residuals: 20 control points (corners of near-rectangular CAD blocks, measured against roof edges in the render),
  rms 2.48 px, max 4.35 px on the 2000 grid (limit 8 px). Checked again in `plan.test.ts` (residuals recomputed from the matrix).
- Plots: 42 read from the 2022 sheet (1 to 20, 144 to 165) are `numberConfidence: "high"`; the other 123 are read from the phone
  photo and are `"low"`. All plots are `indicative`, type and status `"TBD"`. The row-house district is labelled "Row houses,
  indicative as per the current layout plan".
- Floors are `"TBD"` on every building; `floorsIndicative` is a render-based estimate for the diorama only.

### Web plan SVG
`public/plan/shiv-shiva-plan.svg`: 38 KB raw, 7.5 KB gzipped (limit 120 KB). Ids: `boundary`, `b-<building id>`, `plot-<n>`,
`road-<id>`, `g-<id>`, `a-<id>`, `e-<id>`, `district-<id>`, `roundabout`, one `typology-<name>` group per typology. No inline colours,
non-scaling strokes, no CAD title block. Style it with the classes (`plan-building t-flats`, `plan-plot`, `plan-road` ...) and
`currentColor`. `src/content/plan/refs.ts` resolves those ids to points, which is how chapter hotspots stay attached to the plan.

### Chapters
`src/content/plan/chapters.ts`: the six S3 chapters (entry, boulevard, flats, spine-and-gate, row-houses, the-tip). Each has a
camera box `[x, y, w, h]` with the 20:11 stage ratio on the render grid, and 3 or 4 hotspots that name a plan element by SVG id; the
hotspot points are resolved from `plan.json`. Import from `@/content/plan/chapters`.

### Unit plans
`cut_units.py` takes every vector item of a rectangle of the sheet (walls, doors and windows, projections) and the room labels,
shifted to the rectangle origin (viewBox in sheet points; 1 pt = 0.2846 m). Classes: `u-wall`, `u-opening`, `u-edge`,
`u-projection`, `u-other`; text classes `u-room`, `u-size`, `u-area`. The rectangle is cut through the centre of the shared walls.
- `flat-473`: the typical flat (about 40 drawn), sheet label 473, six rooms.
- `flat-large`: the larger plan (hall 17'0" x 10'0", vestibule, master bedroom), ten rooms. Its area label is drawn as stippled
  vector glyphs and cannot be read reliably (it looks like 7xx), so no sheet label is given.
- Area (sq ft and type) and BHK are `"TBD"` on both. Neither is marketed until Darshit confirms.

### Reality-lens tiles
`public/plan/tiles/{z}/{x}_{y}.webp`, 256 px, 4 levels (632, 1264, 2528, 5056 px wide), 376 files, 3.7 MB, quality 82 (limit 12 MB).
`manifest.json` has the level sizes and `gridToPx` (grid point times `gridToPx` is the pixel in that level). Edge tiles keep their
true, smaller size. **Alignment check** (done 2026-10-10): the 4K image has the same aspect as the grid (1.4906 against 1.4903);
phase correlation of edge maps between `TOPDOWN_2K` and the 4K resized to 2000 x 1342 gives a shift of 0 px globally and in five
regions (left, middle, right, top, bottom); plan.json overlaid on the 4K sits on the roofs (see overlay in the scratch folder).

### Media
`public/media/*.webp` are the compressed photoreal masters made by `tools/images/build.mjs` from `media-manifest.mjs` (do not edit
`media.ts` by hand). `media-files.test.ts` checks that every file exists with the width and height declared. The 24 MB originals stay
in Darshit's folder.

### Inventory
`inventory.ts`: one entry per flat block and the mixed-use building (20), floors and units `"TBD"`; plots 1 to 165 status `"TBD"`.

## Known gaps (the Director routes these into docs/QUESTIONS.md)

- Updated layout plan (the colour sheet with the row houses) is the biggest unknown: plot positions and numbers beyond the 2022
  sheet are read from a low-resolution photo and traced by eye.
- Sector is `"TBD"` on 28 buildings: the 19 row-house strips, shops block A, the office and seven flat blocks whose sector the sheet does not state (B3/B4, B5/B6/B7, B8, B20/B21, C6, C7 and the tilted slabs Q1). The sheet tag is `"TBD"` on the 19 row-house strips
  and the Q1 slabs. Floors are `"TBD"` on every building.
- The sheet draws 17 shops; the marketed total is 150. Only block A is drawn. The remaining shops are not shown anywhere.
- The render shows four small low blocks near the lower left, outside the traced boundary, that no plan source names.
  They are not in `plan.json`.
- The building on the plaza at the tip is labelled "clubhouse or temple: TBD".
