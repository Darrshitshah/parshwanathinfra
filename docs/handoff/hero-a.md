# Hero lead A handoff: seg3, seg4, seg4b ("Shiv Shiva builds itself")

Owner: hero lead A (Opus). Lead B owns seg5 and the assembly. Updated at every checkpoint.

## Checkpoint log
- 2026-10-17: measurement done (below). No model call made yet.
- 2026-10-22: resumed. Next: aligned keyframes, then seg3/seg4 on Veo and Omni.
- 2026-10-22: aligned keyframes DONE (no model call): `_source/generated/hero-keyframes/aligned/stage-4-aligned.{png,jpg}`,
  `stage-5-aligned.{png,jpg}` (3840x2160), review sheet `aligned/review/aligned-sheet.jpg`, numbers in `aligned/aligned.json`.
  Method: kf4 / kf5 warped by H(kfk->kf3) (corner shifts at most 25 px, about 4 px in the site), pasted inside the site boundary
  plus building silhouettes (and kf4's two cranes) into kf3's surroundings, one joint graph-cut ground seam, 12 px ground feather,
  2 px along rooflines. 71.6 % of the frame is pixel-identical between stage-4-aligned and stage-5-aligned; outside the site
  stage-4-aligned equals stage 3. Floors: building pixels are the approved keyframes themselves (stage 4 at most 6 levels,
  stage 5 stilts + 5 floors + terrace), so counts are unchanged. Rebuild: `align_keyframes.py` (command below).
- 2026-10-22: seg4b DONE (no model): `_source/generated/video/hero/seg4b-glide.mp4` (3840x2160, 36 frames = 1.5 s, CRF 12, no
  audio; notes in `seg4b-glide.prompt.txt`). Frame 0 = stage-5-aligned, last frame = original `frames-4k/stage-5.jpg` (both within
  H.264 loss, mean 2.6/255). Homography eases from H(kf5->kf3) to identity; kf3's surroundings give way to kf5's outward from the
  site; buildings static. Script `tools/imagegen/hero_glide.py [--seconds S] [--mode grow|dissolve]`.
- 2026-10-22: Veo refuses `enhance_prompt=False` ("Veo 3 prompt enhancement cannot be disabled"): one failed call, logged.
  seg3 Veo take 1 (prompt 3a) submitted.

## What was measured (2026-10-17)
Photoreal keyframes (`_source/generated/hero-keyframes/frames-4k/stage-3/4/5.jpg`, 3840x2160) registered to their clay stages
(`hero-stages/stage-3.png`, `stage-4-floors.png`, `stage-5-floors-warm.png`, one shared Blender camera) by block matching on blurred
gradient maps plus a MAGSAC homography (`tools/imagegen/align_measure.py`). Cross-checked with pixel-exact masks rendered from the
same Blender camera (`tools/imagegen/hero_masks_blender.py`) laid over each keyframe.

| pair | median block shift | corner shifts at 3840 px | homography residual |
|---|---|---|---|
| clay3 → kf3 | 7.2 px | up to about 25 px | 3.1 px |
| clay4 → kf4 | 4.9 px | up to about 10 px | 1.7 px |
| clay5 → kf5 | 3.9 px | up to about 12 px | 1.2 px |

Finding: in the building site, stages 3, 4 and 5 already share the stage-3 camera within about 0.5 % of the frame. The earlier
"camera drift" diagnosis does not hold for the buildings. What differs is the invented surroundings: horizon row (at 2160 px)
kf3 320, kf4 360, kf5 276; the far farmland scale (kf4 reads as a higher camera); kf5 adds a foreground road loop with a
roundabout and moves the right-hand road about 100 px right. The failed takes show a montage: hold, cut to a close-up of three
invented towers or blocks, cut back. Not a slow drift.

## Plan (from the measurement)
1. `stage-4-aligned` / `stage-5-aligned`: homography-corrected site of kf4 / kf5 (inside the site boundary plus building
   silhouettes from the Blender masks) composited into kf3's surroundings, graph-cut seam plus multiband blend. First and last
   frames of seg3 and seg4 then share every pixel outside the site.
2. seg3 = kf3 → stage-4-aligned, seg4 = stage-4-aligned → stage-5-aligned, Veo 3.1 and Omni 1.1 Flash, 4K 8 s.
3. seg4b = programmatic transition stage-5-aligned → original stage 5 (surroundings dissolve plus the small homography glide,
   site static), so lead B's seg5 starts on the untouched original stage 5.

## Outputs so far
- Masks (3840x2160): `_source/generated/hero-keyframes/aligned/masks/` (`mask-site`, `mask-b4`, `mask-b5`, `mask-road3/4/5`).
- Registration: `_source/generated/hero-keyframes/aligned/registration/blocks.json` (homographies, shifts), `field-*.jpg`
  (displacement fields), `mask-on-kf*.jpg` (mask outlines on keyframes), `ov-*.jpg` (clay edges on keyframes).
- Scripts (new files): `tools/imagegen/align_measure.py`, `tools/imagegen/hero_masks_blender.py`.

## Resume commands (from the project folder)
    tools/.venv-blender/bin/python tools/imagegen/hero_masks_blender.py --out "_source/generated/hero-keyframes/aligned/masks"
    ~/.local/bin/uv run --no-project --python 3.12 --with opencv-python-headless --with numpy python tools/imagegen/align_measure.py
    ~/.local/bin/uv run --no-project --python 3.12 --with opencv-python-headless --with numpy python tools/imagegen/align_keyframes.py
