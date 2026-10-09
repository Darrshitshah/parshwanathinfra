# Shiv Shiva Township · Source Pack

Everything the build knows about Parshwanath Infra and Shiv Shiva Township: facts, where every file lives,
how to read the layout plan, and what changed in the row-house district. Compiled on 2026-10-10 from
Darshit's files. **If a fact is not in this file or in a file it points to, it is unknown: render it as
"TBD" on the page and add it to `docs/QUESTIONS.md`. Never invent a number, a distance, a price or a status.**

Paths contain spaces (and this project folder ends in a space: `Parshwanath portfolio `). Always quote them.

---

## 1. Facts

### Confirmed (Darshit's live portfolio, darshitshah.vercel.app, October 2026)

| Field | Value | Source |
|---|---|---|
| Developer (display name) | Parshwanath Infra | portfolio `content.js`, flyer `by Parshwanath Infra.pdf` |
| Legal name | "Parshwanath Infra Pvt. Ltd." as written on the portfolio. Confirm against "Parshwanath Infrastructure Pvt. Ltd." before the footer ships | portfolio `content.js` |
| Spelling | **Parshwanath** (one "a" after "w"). The first prompt draft wrote "Parshwanaath"; every real file uses "Parshwanath" | flyer, portfolio |
| Flagship project | Shiv Shiva Township (wordmark "SHIV SHIVA") | renders, logo files |
| What it is | Integrated, mixed-use township: homes, row houses and shops in one planned neighbourhood | portfolio |
| Offering | 1 BHK and 2 BHK flats · 2 BHK and 3 BHK row houses · shops | portfolio |
| Unit counts | Flats **1,250** · Row houses **165** · Shops **150** · Total **1,565** | portfolio (updated 2026-10-09) |
| Mixed use | One building (sector 01, tagged B1/B2 on the 2022 sheet) is commercial plus residential; it has no separate count | portfolio site plan |
| Status | In development · 2024 → ongoing | portfolio |
| Address | Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road | portfolio |
| Map pin | 20.2934524, 72.9932563 · https://maps.app.goo.gl/DeFCbMwyrYEGZ5Gi9 | portfolio |
| Village on the sheet | KARAMKHAL | layout plan title block |
| Site office | The "BLDG" beside shops block A at the main entry: Ex. Office 01 (11'0" × 12'0"), 02 (11'0" × 11'8"), 03 (11'0" × 11'0"), Reception 9'10" × 15'3", otla, pantry, toilets. Darshit marks it as the Parshwanath Infra office | layout plan, portfolio |
| Darshit's role | Real Estate Project Manager / Business Operations Manager at Parshwanath Infra since Jan 2024 | portfolio |

### From past marketing material (real, but dates unknown: confirm before publishing)

Found in `~/SHIV SHIVA TOWNSHIP/SHIV SHIVA AD/*.pdf` (Instagram posts made for festive offers):

- "1 & 2 BHK flats · Price starts ₹17.05 L onwards" (several posts).
- Festive line in Hindi: a 2 BHK flat at the price of a 1 BHK.
- Sales numbers printed on the posts: **78743 05000** and **78743 06000**. Which one is WhatsApp is not stated.
- "Silvassa Vapi Main Road".

Use the price only as "Starting ₹17.05 L* (*confirm current price)" until Darshit confirms; otherwise show "Price on request".

### Unknown (render "TBD", ask through the batched popup)

RERA registration number and which authority (the site is near Silvassa, so it may fall under the Dadra and Nagar
Haveli and Daman and Diu RERA rather than Gujarat RERA: never guess) · approvals (NA, plan sanction, etc.) ·
land area · floors per building · carpet areas and which area type the sheet's numbers are · company email ·
WhatsApp number · office hours · amenity list as marketed · landmarks and distances · possession dates ·
construction stage · inventory and availability · testimonials · leadership names and photos · company history,
other projects, years in business · logo files for Parshwanath Infra itself (only "by Parshwanath Infra" exists) ·
brochure PDF.

Do not use Darshit's personal email or WhatsApp (they are on his portfolio) for the company site unless he says so.

---

## 2. Files (read-only sources: copy, never edit or move them)

### The layout plan: the key to everything

| File | What it is |
|---|---|
| `/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.pdf` | **The 2022 CAD sheet.** AutoCAD LT 2014 plot, title "LAYOUT PLAN", dated 21-03-2022, scale "NTS". One vector page (1191 × 842 pt in display orientation, raw page rotation 90°), about 90,000 vector paths and 1,600 text labels. Precise geometry for sectors 01 to 05, roads, shops block A, the office, unit plans and dimensions. **Stops at the start of the row-house district** (see section 4). |
| `/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.png` | The same PDF rasterised at 7000 × 4948 px. Use the PDF instead. |
| `/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan-photo.jpg` | **Phone photo of the newer printed colour sheet** ("LAY OUT PLAN"), 2000 × 1125 px, photographed **upside down** (rotate 180° to read). Shows the whole township including the full row-house district, renamed building tags, parking bays and playgrounds. Low resolution: numbers are partly unreadable. |
| `/Users/darshit/Darshit's Portfolio/assets/img/source/masterplan-topdown-upload.webp` | The top-down aerial render, 2000 × 1342 px. **The coordinate grid of Darshit's traced SVG plan** (section 5). |
| `_source/cad/` in this project | Already extracted by `tools/pdf/plan_extract.py` on 2026-10-10: `labels.json` (1,627 labels with positions and kinds), `dimensions.json` (8 metric dimension lines), `colors.json`, `layers/*.svg` (one SVG per CAD colour), `plan-300dpi.png`, `tiles/` (3 × 3 at 600 dpi: every shop size and room label is readable). Re-run it if the folder is missing. |

### Renders and images

| Path | What it is |
|---|---|
| `/Users/darshit/Darshit's Portfolio/assets/img/shiv-shiva/` | **Ready for the web**: 22 photos as `<name>.webp` (1600 w) and `<name>-sm.webp` (760 w): `cover`, `masterplan-topdown`, `masterplan-aerial`, `masterplan-full`, `shop-street-night`, `main-road`, `roundabout`, `clubhouse-lawn`, `towers-courtyard`, `garden-island`, `temple-court`, `row-houses-dusk`, `garden-court`, `play-area`, `clubhouse-court`, `central-lawn`, `courtyard-playground`, `clubhouse`, `row-house-wing`, `row-house-street`, `row-houses-day`, `landscape`, plus `logo.png`. Captions are in the portfolio `assets/js/content.js` gallery list. |
| `~/SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/Photoreal Kit/SS-01 … SS-33 *.jpeg` | The original renders, named. SS-01 Masterplan Aerial, SS-02 Masterplan Top-Down, SS-03 Aerial Row House Wing, SS-04 Aerial Row House Cluster, SS-05 Main Road Corner, SS-06 Main Road Shop Frontage, SS-07 Shop Street at Dusk, SS-08 Roundabout Sculpture, SS-09 Roundabout Plaza Model, SS-10 Towers Courtyard, SS-11 Parking Court and Play Area, SS-12 Courtyard Playground Elevated, SS-13 Clubhouse and Parking Court, SS-14 Central Garden Island, SS-15 Temple Courtyard, SS-16 Landscaped Approach, SS-17 Central Lawn Axis, SS-18 Central Lawn Spine Model, SS-19 Tower Court Lawn Model, SS-20 Clubhouse Lawn Court Model, SS-21 Clubhouse Plaza Wide Model, SS-22 Clubhouse Lawn and Gazebos, SS-23 Childrens Play Area, SS-24 Row House Garden Court, SS-25 Row Houses at Dusk, SS-26 Row Houses by Day, SS-27 to SS-32 Row House lane / corner / street / long view / plaza / porch models, SS-33 Masterplan Aerial Full. "Model" = untextured clay render. |
| `…/Photoreal Kit/Photoreal Output/Hiranandani Style v2/` | **Best visuals**: 33 photoreal 4K PNGs (about 5000 × 3400, about 24 MB each) made with Nano Banana 2.1 from the renders above. Use these for hero and gallery after compressing (section 7 of the build spec). |
| `…/Photoreal Kit/Photoreal Output/*.png` | 4 earlier 4K versions (SS-13, SS-16, SS-25, SS-26). |
| `…/Photoreal Kit/IMAGE NOTES.txt` | Per-render fidelity notes. SS-26 describes the row-house elevation exactly (below). |
| `…/Photoreal Kit/MASTER PROMPT - Hiranandani Style.txt` + `generate_hiranandani.py` | The prompt and script that made the v2 images (section 6). |
| `~/SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/SHIV SHIVA wo BG.png`, `SHIV SHIVA without Background.png`, `SHIV SHIVA.jpg`, `wo bggg.png` | Shiv Shiva logo files (transparent PNGs and a JPG). |
| `~/SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/by Parshwanath Infra.pdf` | "by Parshwanath Infra" lockup (1206 × 543 pt PDF). Extract it as SVG with PyMuPDF. |

Row-house elevation (IMAGE NOTES, SS-26): two storeys with a flat roof; a deep white portal frame around one unit and a
recessed open balcony bay on the next, alternating; a red exposed-brick pillar on each pair; planter boxes with creepers
under the upper windows; car porches on the ground floor; palms along the lane.
Finishes (master prompt): towers in warm khaki sand-olive paint with white projecting box-frames around window stacks,
charcoal horizontal-bar railings, square stilt columns; shop blocks in darker grey-olive with charcoal vertical louvres and
glazed shopfronts; row houses with white portal frames, a red brick pillar, olive walls, planters, car porches; grey
interlocking pavers with granite-edged kerbs.

### Code worth porting (Darshit's portfolio, read only)

| Where | What |
|---|---|
| `/Users/darshit/Darshit's Portfolio/assets/js/app.js` lines 664 to 920 | The interactive site plan Darshit approved: footprints `PJ_B` (rows, flats, shops, mixed), `PJ_CORES`, `PJ_ROADS`, `PJ_MAIN` (the main road), `PJ_BOUND` (site boundary), `PJ_AMENITY`, `PJ_OFFICE`, `PJ_LAWNS`, `PJ_TREES`, all on the 2000 × 1342 render grid; the typology system and the hover/tap/pin linking (`pjLink`); the one-time draw-in (`pjDrawIn`). |
| same file, line 78 | The line-art elevation SVG (row houses, towers, shops) that Darshit kept as his loader art. |
| `/Users/darshit/Darshit's Portfolio/assets/css/main.css` lines 1 to 70 | His tokens: matte red accent `#c43b2f` (dark) / `#a8281e` (light), typology colours blue `#3987e5`, orange `#d95926`, green `#199e70`; fonts Archivo, Instrument Serif, JetBrains Mono. |

### Do not use

- `~/SHIV SHIVA TOWNSHIP/SHIV SHIVA contacts/*.xlsx`: buyer and lead lists with personal data. Never open, copy or upload.
- `~/SHIV SHIVA TOWNSHIP/SHIV SHIVA BILLS/`: private invoices.
- `…/SHIVA SHIVA IMG/Reference Images/` (Hiranandani, Mahindra brochures) and the stock bedroom photos and Canva videos in
  `SHIV SHIVA AD/`: third-party, mood only. The Gujarati song MP3 there is copyrighted.
- `/Users/darshit/Darshit's Portfolio/279e67ab72b2c09512cba2b11c8232d9.jpg`: a third-party architect's sheet from Pinterest.
- The PDF title block: the landowner's name, the architect firm's name, phone numbers, the network file path and the
  "PRODUCED BY AN AUTODESK EDUCATIONAL PRODUCT" stamp. Never show the raw sheet publicly; publish only your own redrawn plan.
- `~/CLAUDE the GOD/` (the parent folder) is a separate live crypto-trading workspace. Never run, edit, commit or restart anything there.

---

## 3. Reading the 2022 layout plan (what it says)

Orientation: the sheet's compass points north up the paper; the frontage road is on the **left** of the sheet.
The aerial render and Darshit's portfolio plan show the site **turned 180°** (road on the right, north pointing down).

- **Sectors 01 to 05.** Building tags: `A` (shops), `BLDG` (office), `B1` to `B21` (flat blocks in sectors 01 to 03 and the
  strip beside the shops), `C1` to `C13` (sectors 04 and 05 courtyard blocks and the C6/C7 cluster). Some tags are drawn as
  graphics, not text: read them from the 600 dpi tiles.
- **Roads.** A 9.00 m wide road along the frontage (the render shows the Vapi-Silvassa Road here; confirm whether the 9 m road is
  the highway or a service lane). Main ENTRY with a 10'0" × 10'0" security cabin. 40'0" wide internal road from the entry to a
  **roundabout**, and a second 40'0" road on the diagonal between sectors 02 and 03. 30'0" wide internal road from the roundabout
  towards the row houses. A 20'0" wide road on the north side. 20'0" and 25'0" wide internal roads at the row-house edge. Five
  ENTRY arrows into the building courts; security cabins 7'2" × 9'0".
- **Open space.** Garden courts in sectors 01, 04 and 05; a linear garden between sectors 04 and 05; triangular gardens along the
  diagonal road; gardens along the north and south edges; parking.
- **Real scale from dimension lines** (the sheet says NTS, but these carry metres): sector 05 garden 92'5" × 127'10"
  (28.16 m × 38.96 m); sector 04 court 93'2" × 191'9" (28.40 m × 58.45 m); gap between sectors 04 and 05: 49'7" (15.12 m);
  25'5" (7.74 m); 15' (4.57 m); 15'2" (4.62 m). Measure each line's end points in the vectors to get points per metre, then
  cross-check with the 40', 30' and 20' road widths. Call every derived number "indicative".
- **Shops block A** (triangular, at the entry; has stairs and a lift, so upper floors exist: count TBD). Sizes and area labels:
  01 33'6" × 10'0" (355) · 02 33'6" × 10'0" (335) · 03 33'6" × 10'0" (355) · 04 33'6" × 10'0" (335) · 05 33'6" × 10'0" (335) ·
  06 33'6" × 10'0" (335) · 07 10'0" × 27'8" (276) · 08 9'8" × 27'8" (276) · 09 20'6" × 10'0" (205) · 10 20'6" × 10'0" (205) ·
  11 20'8" × 16'0" (423) · 12 10'0" × 27'2" (272) · 13 10'0" × 27'2" (272) · 14 10'0" × 40'8" (416) · 15 10'0" × 35'0" (360) ·
  16 10'0" × 29'4" (302) · 17 10'0" × 23'8" (246). Toilet block 16'10" × 6'2", lift 5'6" × 5'6", 9'10" wide passages.
  **Only 17 shops are drawn on the 2022 sheet; the marketed total is 150.** Ask where the rest are before drawing any.
- **Flat plans drawn on the sheet** (area labels are probably sq ft; area type unknown):
  - Typical, label **473** (about 40 drawn): Hall 15'4" × 10'0", Kitchen 8'0" × 7'0", Dining 7'4" × 7'4", Bedroom 10'6" × 10'0",
    Bath 3'6" × 6'4", W.C. 3'6" × 3'6", 3'0" wash, 3'0" balcony, 2'0" architectural projection.
  - Label **439**: Hall 10'0" × 15'4", Kitchen 7'0" × 8'0", Dining 7'4" × 7'4", Toilet 7'0" × 3'6", Bedroom 10'0" × 10'0".
  - Labels **512** and **543**: Hall/Dining 10'0" × 13'6" or 10'0" × 18'2", Kitchen 7'0" × 12'2", Bedroom 10'2" × 9'0", some with a
    Master Bedroom 10'2" × 9'0", Toilet 3'6" × 5'8".
  - Larger type: Hall 17'0" × 10'0", Vestibule 4'6" × 4'6", Kitchen/Dining 15'6" × 8'6", Store 4'6" × 5'0", Bedroom 10'0" × 10'0",
    Master Bedroom 11'6" × 10'0", Toilet 6'10" × 4'0", Bath 6'10" × 3'6", W.C. 3'6" × 3'6", Wash 5'0" × 4'0", 3'6" balcony.
  - Other area labels: 452 (×4), 427, 650. Map every label to its unit by position (`labels.json`), then ask Darshit which plans
    are 1 BHK and which are 2 BHK. The vectors of one typical unit can be cut out of the PDF to draw a real floor plan.

---

## 4. Row houses: what changed (the 2022 sheet does not show them)

**Short version: the 2022 CAD sheet ends where the row-house district begins. The row houses now on the newer printed
sheet and in the renders were added after it. For the row-house district, the printed-sheet photo plus the render are the
only sources until Darshit provides the updated CAD file.**

1. **2022 CAD sheet:** shows only the first two row-house strips, at its cut-off right edge: plots **1 to 20** north of the 30'
   road and **144 to 165** south of it, on 25'0" and 20'0" internal roads. The "30'0" WIDE INTERNAL ROAD" label is cut off at the
   sheet edge. Everything beyond is missing.
2. **Newer printed colour sheet** (`layout-plan-photo.jpg`, rotate 180°) adds the full district beyond that edge:
   - The 30'0" internal road continues as the district's spine, with an **ENTRY** marked where it passes from the flats into the
     row houses (a gated row-house enclave).
   - Plots are numbered **1 to 165** in total, matching the marketed 165 row houses.
   - **North of the spine:** four back-to-back terrace blocks (plot runs approximately 1 to 11, 12 to 28, 29 to 41, 42 to 48:
     read from a low-resolution photo, verify) separated by **20'0" wide internal roads**, ending at a **linear garden with a
     fountain or water feature** between two 20' roads.
   - **At the far tip:** a cluster of four **tilted terrace strips** on diagonal 20'0" internal roads, approximately plots 59/60
     to 108.
   - **South of the spine:** double strips with approximately plots 109 to 165 on 20'0" internal roads; 144 to 165 is the strip
     next to the flats (the same one the 2022 sheet shows).
   - **New open space at the tip:** a large open lawn, a building on a paved plaza (clubhouse or temple: label TBD; the renders
     include a "Temple Courtyard" and a clubhouse), and a play area with a gazebo.
3. **Elsewhere on the newer sheet:** building tags are renamed to letters in yellow circles (S for the shops block, R1/R2, D, E,
   F, G, H, J1/J2, K, L, M1/M2, N1/N2, O1 to O3, Q1 to Q3 and others) instead of B1 to B21 / C1 to C13; parking bays are drawn
   everywhere; playgrounds and a clubhouse appear in the sector courtyards (an infinity-shaped garden in one courtyard matches
   the render). Do not guess the tag mapping: read it from a better scan.
4. **The render** (`masterplan-topdown-upload.webp`, SS-02) matches the newer sheet. Darshit's traced plan encodes it as
   15 terrace strips plus an L-shaped strip and three tilted slabs at the tip (`PJ_B.rows`).
5. **Typology:** 2 BHK and 3 BHK row houses (which plots are which: TBD). Two storeys, flat roof (SS-26 notes). Plans: TBD.

**Ask Darshit (first popup):** "Do you have the updated layout plan as a PDF or DWG (the colour sheet that includes the row houses)?
A phone scan of the printed sheet, shot straight on in daylight, also works." Until then, trace the district from the render
grid, place plot numbers from the photo, and label the district "Indicative, as per the current layout plan".

---

## 5. Coordinates and alignment (so the plan, the render and the 3D model line up)

- **Render grid:** 2000 × 1342 px (`masterplan-topdown-upload.webp`). Darshit's traced SVG uses it; viewBox crop `0 150 2000 1100`.
  The 4K `SS-02 Masterplan Top-Down - hiranandani.png` is 5056 × 3392 (factor 2.528, same aspect): confirm it lines up by overlay
  before using it for deep zoom.
- **Known points on the render grid** (from the traced plan): roundabout centre (1320, 651), radius about 30; main entry from the
  road at (1892, 652); spine road along y ≈ 650; shops block A near (1730 to 1880, 688 to 776); office rectangle x 1643, y 688,
  w 50, h 34; site boundary = `PJ_BOUND`.
- **CAD → render:** the render is the sheet turned 180°, so expect an affine transform with negative scale on both axes. Fit it by
  least squares from at least 6 ground-level control points (roundabout centre, entry, corners of block A, road junctions, the
  sector 01 garden corners), never from roofs (the render has slight parallax). Report the residuals; accept under 8 px on the
  2000 grid, otherwise use a piecewise fit. Store the matrix in `content/plan/transform.json`.
- **Metres:** derive points per metre from `dimensions.json` (section 3), then render-pixels per metre through the transform. The
  Blender model is built in metres.
