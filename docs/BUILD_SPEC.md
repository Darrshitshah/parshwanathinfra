# Build Spec · Parshwanath Infra website, flagship Shiv Shiva Township

This is the one-shot brief. Read it fully, then `docs/SOURCE_PACK.md` (facts and files), then `docs/SWARM_PROMPT.md`
(how the agent team works). Where this spec and the source pack disagree on a fact, the source pack wins.

---

## 0. Mission

Build the marketing website for **Parshwanath Infra**, with **Shiv Shiva Township** (Vapi-Silvassa Road) as the flagship.
It must be the most interactive real-estate website a buyer in India has seen: the township is explored, not scrolled past.
It must still open fast on a mid-range Android phone over 4G, because that is where most buyers open it.

The idea that makes it unlike any other developer site: **the township's own drawings are the interface.** The real AutoCAD
layout plan draws itself, becomes a live map, lifts into a 3D model built from the same plan, and opens into photoreal renders
of the exact spot you are looking at. Every transition on the site is cut from a shape in that plan. No template can copy it,
because no other project has this plan.

Reference for the level of interaction Darshit wants (Instagram reel, "Websites in 2026", by w.wearebrand:
https://www.instagram.com/reel/DeHVnwyPQKb/). What it shows, frame by frame:
1. A residence site opens on a sky full of clouds with a serif wordmark.
2. Scrolling dives down through the clouds onto an aerial of a masterplanned community.
3. The camera settles on one tower at golden hour; "Explore residence" appears.
4. A tower elevation where each floor lights up on hover in availability colours; clicking opens that floor's unit plan on a card.
5. An isometric 3D diorama (white clay with red accents) that the camera travels through, station by station, with info cards.
6. A grid of small 3D icons for services.
Build the Shiv Shiva version of all of these, grounded in real data, and go past them with the plan-driven ideas below.

---

## 1. Non-negotiables

1. **Never lose work.** `git init` (or clone) before writing code. Commit and push after every meaningful step: scaffold, each
   section, each animation system, each fix. Small commits, clear messages. Never end a session with uncommitted work.
2. **Facts only from `docs/SOURCE_PACK.md`.** Anything else renders visibly as "TBD" and goes into `docs/QUESTIONS.md`.
   No invented prices, distances, statuses, testimonials, awards, people or years.
3. **No em dashes or en dashes** anywhere: copy, titles, meta, alt text, README, comments shown to Darshit. Use commas,
   colons, full stops, "·" separators, or "→" for ranges. A test enforces it (section 13).
4. **RERA number on the project page and in the footer** (legal requirement for advertising registered projects in India).
   Until it is known, show "RERA registration: TBD" so the gap is obvious, never a fake number.
5. **Images of buildings are artist's impressions.** Every render and AI-enhanced render carries "Artist's impression" in its
   caption or a visible corner label.
6. **Privacy.** No buyer data from Darshit's folders. Never publish the raw CAD sheet or its title block (section 2 of the source pack).
7. **Performance and accessibility budgets override motion** when they conflict (section 11).
8. **Respect Darshit's taste notes** (section 15). He has rejected specific things before.

---

## 2. Stack

Check the latest stable versions at start (`npm view <pkg> version`) and use them.

- **Next.js** (App Router, TypeScript, `src/` dir) on **Vercel**. Static generation for every page; one route handler for enquiries.
- **Tailwind CSS** with design tokens as CSS variables.
- **GSAP** with ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, CustomEase, Observer (all free in the `gsap`
  npm package since 3.13) and `@gsap/react` (`useGSAP` for scoped cleanup).
- **Lenis** (`lenis` package) for smooth wheel scrolling, synced to ScrollTrigger; native scrolling on touch devices.
- **Motion** (`motion` package, `import { motion } from "motion/react"`, formerly Framer Motion) for component state: drawer,
  menus, cards, form states, hover. **Rule: GSAP owns scroll, SVG and timelines; Motion owns component state. Never both on
  one element.**
- **React Three Fiber** + `@react-three/drei` + `three` for the 3D diorama, loaded only on capable devices (section 11).
- **next/image** for every raster image, **next/font** for fonts, **zod** for content and form validation.
- Image pipeline: **sharp** (AVIF + WebP, responsive widths, blur placeholders). 3D pipeline: **@gltf-transform/cli**
  (meshopt or Draco compression, texture resize to KTX2/WebP).
- Tests: **Vitest**, **Playwright** with **@axe-core/playwright**, **Lighthouse CI** (`@lhci/cli`).
- Enquiry delivery: **Resend** (email) and/or a **Google Sheets** webhook; optional **Upstash Redis** for rate limiting.

Page transitions in the App Router: first evaluate `next-transition-router` (built for GSAP enter/leave in the App Router)
against the installed Next version. If it does not fit, write a small `TransitionProvider`: intercept internal link clicks, play
the leave animation, `router.push`, play the enter animation on the pathname change. Back/forward must always work, and no
transition may delay navigation by more than 900 ms.

Scaffolding note: this folder already holds `docs/`, `tools/`, `.claude/`, `_source/`. `create-next-app` refuses non-empty
folders, so scaffold into `.scaffold/` (`npx create-next-app@latest .scaffold --ts --tailwind --eslint --app --src-dir
--import-alias "@/*" --use-npm --disable-git --yes`, check `--help` first), copy everything except `README.md` and `.gitignore`
up into the root, merge those two by hand, delete `.scaffold/`. Set `"name": "parshwanath-infra"` in `package.json`.

---

## 3. Tooling to install first (the "PDF reader" and Blender)

All of these work without Homebrew and without an admin password. `uv` is already installed at `~/.local/bin/uv`.

**PDF reader (full-quality reading of the layout plan).** PyMuPDF renders the CAD PDF at any resolution, extracts every vector
path and every text label with its position, and exports SVG. The script is ready and tested:

```bash
uv run --no-project --python 3.12 --with pymupdf python tools/pdf/plan_extract.py \
  --pdf "/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.pdf" --out _source/cad --dpi 300 --tiles
```

It writes `labels.json`, `dimensions.json`, `colors.json`, `layers/*.svg`, `plan-300dpi.png` and 600 dpi tiles. When you need
to read small text, open a tile (or render a clip at 600 to 900 dpi with `page.get_pixmap(dpi=…, clip=rect)`, where `clip` is in
display coordinates) instead of the whole sheet: the image reader downsamples big images and loses the small labels.
For the printed-sheet photo, crop and upscale regions with Pillow and rotate 180° before reading.
Do **not** install Homebrew or poppler; PyMuPDF covers everything.

**Blender (headless, as a Python module).** `bpy` 5.2.2 ships an Apple Silicon wheel for Python 3.13:

```bash
uv venv --python 3.13 tools/.venv-blender
uv pip install --python tools/.venv-blender/bin/python bpy==5.2.2
tools/.venv-blender/bin/python -c "import bpy; print(bpy.app.version_string)"
```

Run scene scripts with `tools/.venv-blender/bin/python tools/blender/<script>.py`. Use Cycles (CPU or Metal) for stills and
EEVEE Next for fast passes if available headless; fall back to Cycles. If Darshit wants to inspect the scene, export a `.blend`
and he can open it in Blender.app later (optional install from blender.org; not required for the build).

**Image generation (Nano Banana 2.1, already connected and billed, use it freely).** Darshit's Google Cloud project
`my-jev-autonomous-agent` has Vertex AI with **Nano Banana 2.1** (model id `gemini-nano-banana-2.1`, location `global`),
authenticated through Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`, gcloud in
`~/google-cloud-sdk/bin`). This is how the 33 "Hiranandani Style v2" photoreal images were made. Darshit has approved using it
without restriction for this site. Working pattern (copy from
`~/SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/Photoreal Kit/generate_hiranandani.py`):

```bash
GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent uv run --no-project --python 3.12 \
  --with google-genai --with pillow python tools/imagegen/generate.py <args>
```

`google.genai.Client(vertexai=True, project=…, location="global")`, `generate_content(model="gemini-nano-banana-2.1",
config=GenerateContentConfig(response_modalities=["IMAGE"], image_config=ImageConfig(image_size="4K", aspect_ratio=…)))`.
Lessons that cost Darshit hours, follow them:
- Send **one request at a time** with exponential backoff; parallel calls hit the per-minute quota (HTTP 429).
- For edits of an existing render, attach **only that render** and describe the look **in words**. Attaching a style reference
  image made the model redesign buildings.
- It is a strict edit, never a redesign: same camera, same floor counts, same window bays, nothing added (reuse the "STRICT EDIT"
  and "DO NOT" blocks of `MASTER PROMPT - Hiranandani Style.txt`).
- Darshit's standing choices: Indian residents in candid moments, Indian-market cars with unreadable plates, shop signs as blank
  lit panels, no real brand names, no text or logos in images.
- Save every output with the prompt that made it (`<name>.prompt.txt`) under `_source/generated/`, then run it through the image
  pipeline. Log each call in `docs/IMAGEGEN_LOG.md`.
Good uses here: cloud layers for the sky descent (on transparent or flat backgrounds you can key out), a dusk version of a day
render with the identical camera (for the day/dusk slider), texture tiles for the 3D diorama (pavers, lawn, facade paint),
a clean sky plate, an Open Graph image background, small isometric amenity icons rendered in the diorama's clay style.
Never use it to invent buildings, amenities or views that the plan does not contain.

---

## 4. Data pipeline (the layout plan is the key)

Source of truth, highest first: (1) an updated CAD file if Darshit provides one, (2) the newer printed sheet
(`layout-plan-photo.jpg`) for the row-house district and building names, (3) the 2022 CAD PDF for precise geometry of
sectors 01 to 05, roads, shops, office, unit plans and dimensions, (4) the render for imagery only. Where the render and a plan
disagree, the plan wins for facts and the render wins for pictures. Darshit's confirmed counts (1,250 / 165 / 150 / 1,565)
override everything.

Steps (data lead owns them, see the swarm prompt):
1. Run the extractor (section 3). Classify CAD colours into layers by inspecting `layers/*.svg` (boundary, roads, building
   outlines, gardens, annotations). Write `content/plan/layers.md` explaining which colour is what.
2. Fit the CAD → render transform (source pack section 5). Save `content/plan/transform.json` with residuals.
3. Build `content/plan/plan.json`: site boundary, roads (centre line + width in metres), roundabout, entries, gardens, every
   building footprint with `{ id, sheetTag, newTag?, sector, typology: "flats" | "rowhouses" | "shops" | "mixed" | "office" |
   "amenity", floors: number | "TBD", polygon }`, row-house plots `{ number, strip, polygon, type: "2BHK" | "3BHK" | "TBD",
   status: "TBD" }`, and amenity points. Coordinates on the render grid (2000 × 1342) plus metres. Start from Darshit's traced
   geometry (`PJ_B` and friends), refine sectors 01 to 05 against the CAD vectors, and trace the row-house district from the
   render with plot numbers from the photo.
4. Export a **lightweight web SVG** of the plan (target under 120 KB gzipped): simplified outlines, one `<g>` per typology, ids
   on every footprint and plot. Keep the heavy CAD layers out of the bundle.
5. Cut one typical flat (label 473) and the larger plan out of the PDF vectors into clean floor-plan SVGs with room labels and
   dimensions (`content/units/*.svg`). Mark area type "TBD" until confirmed.
6. Image pipeline: from the v2 photoreal PNGs and the portfolio WebPs, generate AVIF + WebP at 640, 960, 1280, 1920, 2560 widths,
   blur placeholders, and alt text drafts. Never commit the 24 MB originals; they stay in Darshit's folder (`_source/` is
   gitignored).

---

## 5. Content model

All copy, numbers and image paths live in `src/content/`, typed and validated with zod at build time. Components never hold
facts. A missing value is `"TBD"` and renders as a visible TBD chip.

```
src/content/
  site.ts            company, contact, social, legal name, RERA, disclaimers
  projects/shiv-shiva.ts   overview, counts, offering, location, amenities, gallery, sections, SEO
  projects/index.ts  list of projects (only Shiv Shiva is known; others "TBD", hidden until real)
  plan/plan.json, plan/transform.json, plan/chapters.ts (camera stations for the plan and the diorama)
  units/*.ts + *.svg flat and row-house types with rooms and dimensions
  inventory.ts       buildings → floors → units with status; every status "TBD" until Darshit supplies data
  media.ts           every image: src, widths, alt, caption, "Artist's impression" flag
  i18n/en.ts         UI strings, structured so Hindi and Gujarati can be added later
```

---

## 6. Creative direction

**Concept: "Drawn to life."** The plan is the protagonist. Line becomes place: ink linework on paper, then light, then life.

**Motion language from the plan's own shapes:**
- Site boundary → the page-transition curtain (the township outline wipes across the screen and becomes the next page).
- Roundabout circle → iris transitions and the cursor.
- The 40' boulevard → a horizontal wipe line for section changes.
- Row-house strips → staggered "blinds" reveals for galleries.
- Dimension lines with tick marks → how numbers and stats appear (a dimension line draws, the value counts up inside it).

**Look (Darshit picks one in the kickoff popup; build tokens so switching is cheap):**
- A, "Drafting table" (recommended): warm paper `#F3EFE7`, ink `#1A1C1B`, clay white for massing, brick red accent
  `#B5412F` (the red exposed-brick pillar on the row houses, and Darshit's own matte red), forest `#24402F`, sand `#D8C6A3`.
  Typology colours kept from his portfolio, tuned to the palette: row houses orange, flats blue, shops green, mixed use hatch.
- B, "Dusk": deep night `#0E1116`, warm window gold `#E8B86B`, the same typology colours brighter. Built around the dusk renders.
- C, "Portfolio family": Darshit's portfolio tokens (matte red `#c43b2f`, Archivo, Instrument Serif, JetBrains Mono, dark + light).
Whichever wins, support dark and light: light = day renders, dark = dusk renders where a dusk version exists.

**Type:** a refined display serif (Instrument Serif or Fraunces) for headlines; a clean grotesk (Archivo or Inter Tight) for body;
a mono (JetBrains Mono, ligatures off) for drawing annotations, dimensions and labels. The mono annotations are a signature:
every image and plan has small CAD-style callouts.

**Feel:** slow, weighted, precise. Custom eases (`power3.out`, `expo.out`, a CustomEase "draft" curve), never bouncy. Generous
whitespace, large imagery, restrained UI. Buttons are text links with an underline that draws; magnetic pull on primary CTAs;
the only filled button is the enquiry CTA.

---

## 7. Signature experiences

Build each one static first, then add motion, each behind the device tier (section 11).

### S1 · Loader: the boundary draws itself
The real site boundary (from `plan.json`) draws as one continuous ink line (DrawSVG), with the roundabout dot and the main entry
arrow. A counter 0 → 100 tracks real asset loading (fonts, hero image, plan SVG). Then the outline becomes a mask: the hero aerial
is revealed through the township's own shape, which expands to full-bleed. Max 2 s. Skip on repeat visits in the session
(sessionStorage). Reduced motion: a static outline and a fade.

### S2 · Sky descent (hero)
Inspired by the reel. The page opens in the sky above Vapi and Silvassa: 2 or 3 layered cloud plates (generated, section 3),
the Shiv Shiva wordmark and a one-line statement with a split-text reveal. Scrolling descends: clouds scale and part, the aerial
render (`SS-01` / `SS-33` photoreal) comes up from below with a slow push-in, then the aerial cross-fades into the top-down render
and the line plan fades in on top of it in perfect register (they share the render grid). The hero is pinned for this; on phones
it is a shorter, simpler sequence. Poster image is the LCP element and must be visible without JavaScript.

### S3 · The Living Plan (signature moment, pinned)
One vector stage built from `plan.json`. Scroll drives a camera through chapters, each a zoom + pan to a region with labelled
hotspots fading in:
1. **Entry**: the Vapi-Silvassa Road, main entry, security cabin, shops block A, the Parshwanath Infra office.
2. **Boulevard**: the 40' road to the roundabout and its sculpture.
3. **Flats**: sectors 01 to 05, courtyard gardens, the mixed-use building, playgrounds.
4. **Spine and gate**: the 30' road and the row-house entry.
5. **Row houses**: 165 homes on 20' lanes, the linear garden with the fountain.
6. **The tip**: open lawn, clubhouse or temple plaza (label TBD), play area.
Interaction (after the scroll story, or anytime via "Explore the plan"):
- **Typology filter** keyed 1 Row houses, 2 Flats, 3 Shops, 4 Mixed use. Hover, focus or tap any key, footprint or bar segment and
  the same typology lights up everywhere (port Darshit's `pjLink` behaviour: hover previews, tap pins, Escape or empty click
  clears, mixed use lights up partially with flats and shops). A unit-mix bar shows 1,250 / 165 / 150, total 1,565.
- **Reality lens**: a circular lens (the roundabout shape) follows the pointer or a finger drag; inside it, the photoreal top-down
  render shows the exact spot under the line drawing, pixel-aligned. On mobile the lens is a draggable button-sized circle.
  Render imagery is tiled (deep-zoom tiles from the 4K top-down) so zooming stays sharp without downloading 28 MB.
- **Zoom and pan** with wheel, pinch and buttons; keyboard: arrow keys pan, +/− zoom, Tab moves through hotspots.
- **Row-house plot picker**: at row-house zoom, plot numbers 1 to 165 appear on their strips; tapping a plot opens a card with
  type (2 BHK / 3 BHK / TBD), status (TBD), the elevation and an "Enquire about plot N" action that pre-fills the form.
- **Building picker**: tapping a flat block opens S5 for that block.
- **Accessible twin**: a list/table view of zones, buildings and plots with the same data, reachable without the canvas.
Build it so Darshit can drop in an updated plan: geometry only in `plan.json`, no coordinates in components.

### S4 · The 3D diorama (Blender → web)
An isometric, white-clay model of the township with brick-red and typology accents, like the reel's diorama but built from the
real plan. Pipeline (`tools/blender/`):
1. `build_scene.py` reads `plan.json` (metres) and builds: ground, roads (slightly sunken, kerbs), lawns, footprints extruded by
   floors × 3.0 m (floor counts from `plan.json`; while "TBD", use an estimate from counting floors in the renders, flagged
   `indicative: true`, and ask Darshit), row houses at two storeys with a parapet, roundabout with a simple sculpture, low-poly
   trees instanced, a few cars as simple blocks. Materials: clay white, typology tints on roofs, brick red accents.
2. `cameras.py` adds one camera per chapter of S3 plus an isometric overview; `render_stills.py` renders a still per camera
   (1920 w, AVIF/WebP after the pipeline) and a 48 to 72 frame orbit or fly-through sequence for scroll-scrubbing on phones.
3. `export_gltf.py` exports a GLB; compress with gltf-transform (meshopt, quantize, texture resize). Target 2.5 MB or less.
On the web: Tier A loads the GLB in React Three Fiber after the hero has painted (dynamic import, `ssr: false`). Scroll moves the
camera between the same chapter stations as S3 with eased interpolation; hotspots are HTML labels anchored to 3D points; hover a
building to tint it in its typology colour; click to open S5. Tier B shows the pre-rendered sequence scrubbed by scroll (canvas
drawImage, frames lazy-loaded in order). Tier C shows the overview still. Same chapters, same labels, everywhere.

### S5 · Building explorer (floor picker → unit plan)
For a flat block: an elevation (photoreal render crop or a clean line elevation drawn from the Blender model) with an SVG band per
floor. Hovering a floor highlights it in availability colours (available / booked / TBD from `inventory.ts`; all TBD for now, so
the legend says "Availability on request"). Clicking a floor opens a card listing its units; clicking a unit draws its CAD floor
plan room by room (DrawSVG), with room names and sizes in mono, and an "Enquire about this home" action. Floor counts come from
`plan.json`; while unknown, the explorer shows "Floors: TBD" and uses the indicative count visibly marked.

### S6 · Row-house street
A pinned panorama of the row-house elevation (SS-26 by day). A day ↔ dusk slider or scroll scrub, **only if** both images share
the camera; if SS-25 and SS-26 are different framings, generate a dusk version of SS-26 with Nano Banana (same camera, strict edit)
and use that pair. Callouts in mono point at the features from the IMAGE NOTES: white portal frame, recessed balcony bay, red
exposed-brick pillar, planters with creepers, car porch, two storeys, flat roof.

### S7 · Plan-shape transitions
Implement the motion language of section 6 as reusable primitives in `src/motion/`: `boundaryCurtain`, `roundaboutIris`,
`boulevardWipe`, `stripBlinds`, `dimensionCount`, `inkDraw`, `splitReveal`. Page transitions use the boundary curtain in the
brand colour with the next page's title sliding through it. Use Flip for shared elements: a project card's image expands into the
project page hero; a plan zone expands into its section.

### S8 · Cursor and micro-interactions (desktop only)
Darshit's preferred cursor: a small circle that inverts over content, grows over interactive elements and becomes a labelled disc
("View", "Drag", "Explore") over media and the plan. No arrow-and-glow cursor (rejected before). Magnetic primary CTAs, underline
drawing on links, image hover with a slight parallax inside the frame.

---

## 8. Pages

1. **Home**: S1 loader → S2 sky descent hero → brand statement (large type, words fill with colour as you scroll) → numbers (unit
   counts drawn as dimension lines, S7 `dimensionCount`; only confirmed numbers) → S3 Living Plan → S4 diorama ("Walk the
   township") → amenities (horizontal gallery driven by vertical scroll on desktop, vertical stack on phones; each card has a small
   isometric icon from the diorama and a parallax image; only amenities visible in the plan or renders, labelled "as per plan") →
   S6 row-house street → location (stylised SVG map: Vapi, Silvassa, the Vapi-Silvassa Road, the site pin; landmark lines draw
   only for landmarks Darshit confirms, distances TBD until then; a "Open in Google Maps" link with the real pin) → gallery reel
   (strip-blind reveals, lightbox) → enquiry CTA (big statement, magnetic button, opens the enquiry drawer).
   No testimonials section until real testimonials exist (hide it, do not fake it).
2. **Projects** (index): Shiv Shiva first; any other project only when real data exists.
3. **Project detail** (`/projects/[slug]`, Shiv Shiva): hero with name reveal; sticky sub-nav (Overview, Plan, Homes, Row houses,
   Amenities, Location, Gallery, Brochure, Enquire) with an animated active indicator; S3 in full; unit types (flats and row
   houses) with CAD plans; S5; S6; amenities; location; gallery lightbox (drag and swipe, keyboard, zoom); brochure download gated
   by the enquiry form (button visible but "Brochure: TBD" until a PDF exists); RERA block; disclaimers.
4. **About**: story, values, a scroll-scrubbed timeline (only real milestones: "2024 · Shiv Shiva Township development begins"
   is the one known; everything else TBD and hidden until supplied), leadership cards (hidden until names and photos exist).
5. **Contact / Site visit**: split layout, form on one side, the office map on the other (lazy-loaded on interaction, MapLibre +
   OpenFreeMap tiles or a static map image with a link; no API key needed), office address, phone numbers (TBD until confirmed),
   directions link.
6. **Legal**: privacy policy, RERA disclaimer, "artist's impression" note, terms of use. Draft plainly and mark for Darshit's
   review; do not claim compliance you cannot verify.
7. **404**: the line plan with a "you are off the plan" joke and a way home.
Floating WhatsApp button on every page (number TBD until confirmed; hide the button while TBD rather than linking a guess).

---

## 9. Enquiry flow

- Fields: name, phone (Indian mobile: strip spaces, accept `+91` or `0` prefix, then `^[6-9]\d{9}$`), email optional, project,
  interest (1 BHK flat / 2 BHK flat / 2 BHK row house / 3 BHK row house / shop / not sure), budget range, preferred site-visit
  date, message optional, consent checkbox for being contacted.
- Opens as a drawer (Motion) from any CTA; pre-fills project, plot or unit when opened from the plan or explorer.
- Submits to `src/app/api/enquiry/route.ts`: zod validation, honeypot field, time trap (reject submits under 3 s after open),
  rate limit (Upstash Redis when `UPSTASH_REDIS_REST_URL` is set, otherwise a best-effort in-memory limiter), then Resend email
  (`RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ENQUIRY_FROM_EMAIL`) and/or a Google Sheets webhook (`SHEETS_WEBHOOK_URL`).
  Secrets only in `.env.local` and Vercel env vars; commit `.env.example` with names only.
- If no delivery provider is configured, the route returns `503 { ok: false, reason: "not-configured" }` and the UI says so
  honestly and offers phone and WhatsApp. Never pretend a lead was sent. Log server-side errors with context, never the lead's
  personal data in plain logs.
- Success state: a checkmark that draws itself, the visit date echoed back, and "Chat on WhatsApp" as the next step.

---

## 10. Device tiers

Detect once on the client, store in a context, and let every heavy feature read it:
- **Tier A** (desktop or capable phone: WebGL2, `deviceMemory` ≥ 4 or unknown on desktop, no `saveData`, effectiveType 4g):
  everything, 3D diorama in WebGL, Lenis on wheel devices.
- **Tier B** (mid-range Android, the main audience): pinned sections shortened, diorama as a scroll-scrubbed image sequence,
  lens with lower-resolution tiles, no Lenis (native touch scroll).
- **Tier C** (`saveData`, 2g/3g, or `prefers-reduced-motion`): static images, fades only, no pinning, no parallax, plan as an
  interactive but non-animated SVG.
Pinned horizontal sections become vertical stacks on small screens if they jank. Test at 360 px width first.

---

## 11. Performance and accessibility budget (overrides motion)

- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95, on the home page and the project page.
- LCP < 2.5 s on simulated 4G; CLS < 0.1; INP < 200 ms. Animate `transform` and `opacity` only. No layout shift from animations.
- Initial JS for the home route under 200 KB gzipped (GSAP, Lenis and Motion included). Three.js, the lightbox, the map and the
  diorama load only on demand.
- Hero: the poster/LCP image under 200 KB (AVIF), served with `priority`. Any hero video under 3 MB with a poster, never on Tier C.
- Kill ScrollTriggers, Lenis listeners, WebGL contexts and RAF loops on route change (use `useGSAP` scopes and effect cleanups).
- `prefers-reduced-motion`: no smooth scroll, no pinning, no parallax, simple fades; every piece of content reachable without
  animation.
- Keyboard navigable, visible focus states, skip link, alt text on every image, AA contrast, the plan and diorama have text
  equivalents, the drawer traps focus and restores it.

---

## 12. SEO

Per-page metadata and Open Graph images (`next/og`), canonical URLs, `sitemap.ts`, `robots.ts`, semantic headings (one h1 per page).
JSON-LD: `Organization` / `RealEstateAgent` for Parshwanath Infra, `ApartmentComplex` or `Residence` with `geo` and `address` for
Shiv Shiva Township. English copy; structure strings so Hindi and Gujarati can be added later without touching components.

---

## 13. Testing and quality gates

- **Vitest**: content schemas validate; unit counts sum to the total; every image has alt text; **no em dash (U+2014) or en dash (U+2013)
  in `src/` and `docs/`**; phone validation; rate limiter; enquiry route (valid, invalid, honeypot, time trap, not-configured).
- **Playwright** (mobile 360 × 800 and desktop 1440 × 900): home loads without console errors; no horizontal scroll at 360 px;
  navigation works with `reducedMotion: "reduce"`; the Living Plan is operable by keyboard; the enquiry drawer opens, validates and
  submits against a mocked provider; axe finds no serious or critical violations.
- **Lighthouse CI** with the budgets in section 11 as assertions.
- `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` must pass before any push to the main branch.

---

## 14. Working order, git and Vercel

1. Kickoff popup (swarm prompt), then scaffold, push, connect Vercel.
2. Design tokens, fonts, layout shell, nav, footer, page transitions, device tiers. Push.
3. Data pipeline: plan.json, web SVG, unit plans, images. Push.
4. Home sections one at a time, static first, then motion. Push after each.
5. Living Plan. Push. Blender diorama and its web layers. Push.
6. Project detail, About, Contact, Legal, enquiry API. Push after each.
7. Reduced-motion pass, 360 px pass, Lighthouse pass, fix to budget. Push.
8. Final README and the list of every TBD still open.

Git: branch `develop` for the build (every push gets a Vercel preview URL); `main` is production. Promote to `main` only after
Darshit approves a preview (his chosen flow: private preview first, then production). Never force-push. No GitHub CLI on this Mac;
git uses the macOS keychain. If the repo or Vercel project does not exist yet, ask Darshit in the kickoff popup; Vercel import
happens once on vercel.com (Add New → Project → import the repo, framework Next.js), or with `npx vercel@latest link` (device login,
codes expire in about 10 minutes, so only while Darshit is awake). Set env vars in the Vercel dashboard.

Before each step, say in one line what you are about to build; after each push, give the preview link.

---

## 15. Darshit's taste notes (from his portfolio sessions)

- **Liked**: the precise line-drawn site plan with typology colours and hover/tap linking; the blueprint and SVG line-art loaders
  (row houses, towers, shops); one-time draw-in of the plan on first view; the circle cursor that inverts and grows; workflows shown
  as honest "sample runs" with no invented numbers; matte red accent; dark + light themes.
- **Rejected**: a tile-by-tile "build sheet" (ink drawing → study model → render tiles with red callouts) for the masterplan; a
  photo, pencil-sketch or ASCII loader; an ASCII sculpture; an arrow-and-glow cursor. Keep the plan one continuous, precise drawing,
  not a set of image tiles.
- **Process**: ask decisions through popups with concrete options and a recommended first option; decide trivial things yourself.
  He edits and deploys between sessions: re-check file state before editing and never revert his changes. Plain-language
  explanations; he is an operations manager who builds with AI, not a professional developer.
- **Copy**: no em dashes, ever.

---

## 16. Definition of done

- All pages built, all signature experiences working on Tier A, B and C, budgets met, tests green, pushed, preview deployed.
- `README.md`: how to run, build, deploy, where content lives, how to update the plan, how to re-run the PDF extractor, the
  Blender pipeline and the image generator.
- `docs/QUESTIONS.md`: every TBD, grouped (legal, prices, plan, people, contact), each with where it shows on the site.
- `docs/DECISIONS.md`: every choice made without Darshit, with the option taken and why.
- A final message to Darshit: preview link, what is done, what is TBD, what needs his eyes first.
