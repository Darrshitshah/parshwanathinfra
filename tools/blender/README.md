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
- Floors are TBD in the plan: height = `floorsIndicative` x 3.0 m (fallbacks in `common.py`), always shown as "Indicative massing".
- Roofs carry the typology tint (colours from `tokens.css`), walls stay clay white, brick red is only the entry piers, the roundabout sculpture and a few accents.
- Nothing is invented: only buildings, plots, roads, gardens and amenities that plan.json lists. Amenity heights are placeholders (1 to 2 storeys).
- Row-house plots (165, indicative) are drawn as parapet tiles on the strips.
- Node names are the contract with the web scene: `b-<building id>`, `plots-<strip id>`.

## Files
`common.py` helpers · `build_ground.py` ground, sunken roads, lawns, roundabout · `build_town.py` buildings, plots, amenities, entries,
trees, cars · `build_scene.py` entry point · `cameras.py` · `render_stills.py` · `to_webp.mjs` · `export_gltf.py`.
