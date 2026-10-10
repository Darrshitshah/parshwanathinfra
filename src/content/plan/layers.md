# CAD layer map: the 2022 layout plan

Source: `layout-plan.pdf`, an AutoCAD LT 2014 plot dated 21-03-2022, one page, 1191 x 842 pt in display orientation
(raw page rotation 90), about 90,000 vector paths and 1,627 text labels. The PDF keeps no named CAD layers: a "layer" is a
stroke colour. Coordinates are PDF points in display orientation (origin top left, y down). On the sheet, north is up the paper and
the frontage road is on the left; the aerial render shows the same site turned 180 degrees.

Re-create the extraction with `tools/pdf/plan_extract.py` (output in `_source/cad/`, never committed). The sheet itself, its title
block and the colours marked "never publish" below are not used on the site.

## Colour to meaning

| Stroke colour | Paths | What it is | Use in the pipeline |
|---|---|---|---|
| `#000000` black | 40,869 | Walls and wall fill of every building, stair outlines, shops block A, the office, door-leaf lines, plus the sheet frame, the title block and the "LAYOUT PLAN" box (never publish) | Building outlines: segments shorter than 250 pt, title block and frame excluded, closed by buffering (+2.0 pt then -1.5 pt). See `tools/pdf/fit_transform.py` and `cad_buildings.py` |
| `#003fff` blue | 32,030 | Doors, windows, door swings and bathroom fixtures inside flats (0.6 pt hairlines) | Room detail for the unit plans (`tools/pdf/unit_plans.py`) |
| `#ff00ff` magenta | 7,475 | Dashed projection lines (balconies, chajjas, architectural projections), the long thin dimension lines that carry the metric values, and the compass rose in the title block | Dimension lines give the scale (`transform.json`, `metresPerCadPt`); dashes show where balconies project |
| `#ff0000` red | 5,381 | Stair treads and lift shafts, the red tag circles (B1 to B21, C1 to C13, A), the ENTRY arrows (outline), the row-house plot outlines and ticks at the right edge of the sheet (plots 1 to 20 and 144 to 165) | Building tags, entries, the first plot outlines |
| `#004d00` dark green | 2,345 | Micro hatch marks (0.12 to 0.36 pt) in one 24 x 13 pt patch near the first row-house strip | Ignore |
| `#b8008a` crimson | 840 | Heavy dashes along building faces: balcony slab and cantilever edges | Optional detail only |
| `#ff7f00` orange | 341 | Short hairlines in unit plans (door and window ticks) | Unit plan detail |
| `#0000ff` pure blue | 260 | Road kerbs and edges (the 40 ft and 30 ft internal roads, the 20 ft road, the roundabout octagon, the 9.00 MT frontage road), garden outlines (sector courts, the linear garden, the triangular gardens) | Road centre lines and widths, garden polygons |
| `#b88a00` dark yellow | 179 | Plot lines and end ticks of the row-house strips at the sheet edge | Plot geometry for plots 1 to 20 and 144 to 165 |
| `#bf00ff`, `#8a00b8`, `#c16edd` purple | 147, 18, 6 | The architect's logo block in the title block (never publish) | Ignore |
| `#767676` grey | 145 | A parked-car symbol beside the office plot | Ignore |
| `#b3ffb3` light green | 101 | Filled bars at balcony edges and the lawn hatch of the office plot | Optional detail |
| `#954a00`, `#955d4a` brown | 48, 34 | Small markers inside the row-house plots (vertical dashes, triangle arrows) | Ignore |
| `#b80000` dark red | 3 | The site boundary: one 666-segment polyline plus two short pieces near the right edge | The boundary reference (the plan boundary itself is traced on the render, see below) |
| `#dfff7f`, `#381c00` | 1, 1 | A short line on the frontage road edge and a car outline | Ignore |

## Text labels (`labels.json`)

1,627 labels after the title block names were removed: room names and sizes, area labels, 139 plot or flat numbers, 32 building
tags read as text (the other tags are drawn as graphics and are read from the 600 dpi tiles), 17 shop labels, 5 sector labels,
road width labels, 22 facility labels (ENTRY, SECURITY CABIN, the EX. OFFICE rooms), 16 open-space labels (GARDEN, PARKING).

## Scale and alignment

- Scale from the long dimension lines: 0.2846 m per CAD point (four lines, spread 0.2830 to 0.2865). Road widths imply 0.2804 m per
  point (40 ft = 43.5 pt, 30 ft = 32.6 pt), 1.5 percent lower; the mean of the two, 0.2825, is what a 1:800 plot would give.
  Every metre value derived from it is indicative.
- CAD to render grid: a near pure 180 degree rotation at 1.1407 render px per point (`transform.json`). 20 control points, rms
  2.5 px, max 4.4 px. Fitted to the building roofs the viewer sees, not to ground features (see `docs/DATA_NOTES.md`).

## What the sheet does not show

The 2022 sheet stops at the first two row-house strips (plots 1 to 20 and 144 to 165, cut off at the right edge). The rest of the
row-house district, the renamed building tags and the playgrounds exist only on the newer printed colour sheet (photo) and in the
render.
