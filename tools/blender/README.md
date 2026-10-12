# Diorama pipeline (Blender, headless)

White-clay model of Shiv Shiva Township built from `src/content/plan/plan.json`. Run from the project folder (quote the path,
it ends with a space). Python is `tools/.venv-blender/bin/python` (bpy 5.2.2). Source `.blend` goes to `_source/blender/` (gitignored).

## Rebuild when plan.json or chapters.ts change
```bash
P=tools/.venv-blender/bin/python
$P tools/blender/build_scene.py                 # model + src/features/diorama/scene-meta.json (heights, frame, counts)
$P tools/blender/cameras.py                     # cameras + light; reads the 6 view boxes from src/content/plan/chapters.ts
$P tools/blender/render_stills.py stills --width 1920 --samples 64 --out <scratch>/stills
$P tools/blender/render_stills.py sequence --frames 66 --width 1280 --samples 40 --out <scratch>/seq
node tools/blender/to_webp.mjs --in <scratch>/stills --out public/3d/stills --budget 250000
node tools/blender/to_webp.mjs --in <scratch>/seq --out public/sequences/diorama --budget 60000
$P tools/blender/export_gltf.py                 # public/3d/shiv-shiva.glb, meshopt + instancing, budget 2.5 MB
npx vitest run src/features/diorama             # fails if renders and chapters.ts fall out of step, or a size budget is broken
```
If you change the number of frames, update `FRAME_COUNT` in `src/features/diorama/frames.ts`.

## Rules baked in
- Metres = grid px x `metresPerPx`, centred on the site; plan y (down) becomes Blender -Y.
- Floors come from `floors` in plan.json (flats, mixed, shops A: 6 levels; row houses: 2 storeys), 3.0 m per level, with a roof terrace and a 1.1 m parapet above (flats also get stair/lift headroom blocks). `common.py` holds the same confirmed counts as a fallback if a plan entry says TBD. The web labels carry only "Artist's impression".
- Roofs carry the typology tint (colours from `tokens.css`), walls stay clay white, brick red is only the entry piers, the roundabout sculpture and a few accents.
- Nothing is invented: only buildings, plots, roads, gardens and amenities that plan.json lists. Amenity heights are placeholders (1 to 2 storeys).
- Row-house plots (165, indicative) are drawn as parapet tiles on the strips.
- Node names are the contract with the web scene: `b-<building id>`, `plots-<strip id>`.

## Files
`common.py` helpers · `build_ground.py` ground, sunken roads, lawns, roundabout · `build_town.py` buildings, plots, amenities, entries,
trees, cars · `build_scene.py` entry point · `cameras.py` · `render_stills.py` · `to_webp.mjs` · `export_gltf.py`.

## Hero camera and construction stages (for the Nano Banana film frames)
```bash
$P tools/blender/hero_camera.py --overlay <scratch>/cam   # solves the camera from hero_gcps.json, writes hero_camera.json, overlay.png
$P tools/blender/render_stages.py                         # _source/generated/hero-stages/stage-1..5.png (2560 x 1440) + contact-sheet.png
```
`hero_gcps.json` holds the control points between the SS-01 aerial and plan.json (the C-shaped mixed-use building, the tip feature, the
Vapi-Silvassa road edges). The aerial is an artist's render, so the match is approximate (about 37 px RMS on the 2000 px frame; far
row houses drift most). Stages keep the aerial's vertical field of view, so extra land shows at both sides of the 16:9 frame.

### Storey detail for the hero stages (`--detail`, hero renders only, never the web GLB)
Plain clay blocks read as about 4 storeys to Nano Banana, so stages 4 and 5 can be re-rendered with a countable facade
(`hero_detail.py`): flats, mixed use and shops A = open 3.6 m ground level on square stilt columns + five 2.88 m upper levels
(total still 18 m), a slab band at every level, recessed window bays between piers every ~3.6 m with a dark glazing panel in each bay,
terrace with the 1.1 m parapet and the same stair/lift blocks; row houses = 2 x 3 m with a floor band, piers and windows (plot parapet
tiles unchanged). Stage 4 gets bare RC frames (columns + full slabs) at the same partial heights, block infill on the lower storeys.
Footprints, heights, camera and light are those of the plain stages.
```bash
$P tools/blender/render_stages.py --detail --warm --samples 96   # needs _source/blender/shiv-shiva.blend
#   -> _source/generated/hero-stages/stage-4-floors.png, stage-5-floors.png (2560 x 1440), stage-5-floors-warm.png (golden light)
#   --only 4|5 renders one stage; the plain stage-1..5 files and contact-sheet.png are not touched in --detail mode.
```
Count check: crops `stage-5-floors-crop-{A,B,C}.png` (2x) and `-A-count.png` / `-C-count.png` with the storeys numbered G, 1 to 5 and T (terrace).
In the Nano Banana prompt describe the ground level as the open stilt level and the five window rows above it (G + 5 = six storeys).

