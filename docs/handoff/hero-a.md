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
- 2026-10-22 PAUSE (coordinator, usage 73 %). Nothing in flight (Veo operation 9c5dade1-ccf3-422b-b3db-59abb05b73c2 finished).
  seg3 Veo DONE: `_source/generated/video/hero/seg3-veo-aligned.mp4` (8.00 s, 4K, 36 MB, logged, uploaded to
  `gs://parshwanath-infra-veo/review/hero/seg3-veo-aligned.mp4`). Automatic check: camera locked (max shift 0.6 px at 3840 against
  the first frame on the unchanged surroundings, no lost frames, so no swoop and no cut). VISUAL CHECK STILL PENDING (invented
  buildings, at most 6 levels): strip `scratchpad/hero-a/frames/seg3-veo-aligned-strip.jpg`, stills `-0..5.jpg`, numbers
  `-check.json`, preview `scratchpad/hero-a/seg3-veo-aligned.mp4` (scratchpad was wiped at the last reset; rebuild with `review`).
  Also done: `seg4b-glide-2s.mp4` (2 s variant), both seg4b files uploaded to the review bucket. SEG34_READY.json NOT written yet.
- 2026-10-23 (new hero lead A session) seg3-veo-aligned FRAME-CHECKED BY EYE: FAIL. Camera truly locked (no swoop, no cut, max
  frame-to-frame change 2.95 at 7.0 s), but content fails: 1.5 to 3.5 s bare columns shoot up several storeys; 3.5 to 6.5 s an
  invented 10-storey tower plus a second tall block in the centre and two green-netted 8-storey blocks on the right, cranes far
  taller than the last frame (jibs reach the top of the frame); 6.5 to 7.9 s the towers shrink into the stage-4 frames. The
  automatic lock check cannot see this: it only watches the surroundings. Dense sheets (every 0.5 s): scratchpad
  `hero-a/frames/seg3-veo-aligned-dense0/1.jpg`. Tool change: `review` now also writes the dense sheets and a per-frame cut detector
  (`jumps`) into the check JSON. Likely cause: prompt 3a says "columns first", "tower cranes rise", and "construction time-lapse"
  (stock time-lapses are high-rise). Next: prompt 3b (low-rise, no "tower", explicit height schedule) on Omni, then seg4 4a on both.
- 2026-10-23 IN FLIGHT: `run 3 omni 3b -3b` (synchronous Interactions call, raw output lands in
  `gs://parshwanath-infra-veo/review/hero/omni-raw/`; if cut off, look there for a new mp4 and strip its audio with -an).
  Omni returned 16:44: raw `gs://parshwanath-infra-veo/review/hero/omni-raw/13276931964153945905.mp4` -> `seg3-omni-aligned-3b.mp4`.
- 2026-10-23 16:50 seg3-omni-aligned-3b DONE, frame-checked by eye: PASS (best seg3 so far). `_source/generated/video/hero/
  seg3-omni-aligned-3b.mp4` (8.00 s, 4K, 33 MB, audio stripped, in the review bucket). Camera locked (max 1.3 px, no cut, max
  frame change 2.07 at 1.71 s). Plinths hold 0 to 1.2 s, frames rise floor by floor 1.25 to 2.75 s (smooth, no pops), red-brick
  row houses at the back, then netting, scaffolding and the right-hand crane appear 4.5 to 6 s, static 6 to 8 s. No invented
  building, nothing taller than stage 4 at any time (full-res crops at 2.5 s and 7.94 s vs stage-4-aligned). Ends: first frame
  MAD 9.4 vs stage-3, last 11.0 vs stage-4-aligned (softer than the keyframe, same floors). Caveat: the rise is front-loaded.
- 2026-10-23 seg4b-glide (1.5 s) and seg4b-glide-2s checked by eye (dense sheets every 3 to 4 frames): PASS. Buildings identical
  in every frame; the yard turns into kf5's road loop, roundabout and trees outward from the site (visible change about 0.5 to 1.0 s
  in the 2 s file), no ghosting. 1280 px phone previews go to `_source/generated/video/hero/previews/` (seg3-omni-aligned-3b done).
- 2026-10-23 16:46 `run 4 veo 4b -4b` FAILED: Veo accepted operation 3c49cc38-6c0c-4a29-897f-1b8fd8f1cfce, then returned code 8
  "service is currently experiencing high load" (logged). `run` now resubmits a Veo job up to 3 times on that error (120 s, 240 s
  pauses), each attempt logged. No file was written, so the same name can be reused.
- 2026-10-23 16:53 seg4-omni-aligned-4b DONE, frame-checked by eye: PASS WITH CAUTION (usable, not clean).
  `_source/generated/video/hero/seg4-omni-aligned-4b.mp4` (8.00 s, 4K, 34 MB, raw omni-raw/14290616554113615718.mp4, in the bucket).
  Camera locked (max 2.5 px). Floors hold: full-res crops at 3.5 s and 7.94 s show stilts + 5 floors + terrace, nothing taller, no
  invented block; last frame matches stage-5-aligned (MAD 9.8), first frame MAD 10.7 vs stage-4-aligned. Flaws: 2.8 to 3.1 s a ghosted
  cross-dissolve (the left blocks and the front block fade from bare frames to finished walls); 5.25 s a one-frame pop (the last
  netted block at the back and its netting vanish, courtyard palms appear; frame change 6.9 vs median 0.26).
- 2026-10-23 16:53 queue runner started (scratchpad `hero-a/queue.sh`, jobs in `hero-a/queue.txt`, log `hero-a/logs/queue.log`,
  per-job logs `hero-a/logs/q-run_*.log`): `run 4 veo 4b -4b` (16:52, Veo operation c250ad2c-ae45-4ff2-990d-c22ff124e056), then
  `run 4 omni 4c -4c`, `run 3 veo 3b -3b`, `run 3 omni 3c -3c` (3c = 3b with the rise spread over the whole clip). From 16:55 the
  Veo negative prompt and the Omni "Avoid" tail also name ghosting, cross-dissolve and transparent buildings.
- 2026-10-23 17:05 seg4-veo-aligned-4b DONE, frame-checked by eye: PASS (best seg4 so far). `_source/generated/video/hero/
  seg4-veo-aligned-4b.mp4` (8.00 s, 4K, in the bucket). Camera locked (0.6 px), no cut, no pop (max frame change 1.26, no spikes).
  0 to 1 s stage 4; 1.5 to 2.5 s green netting wraps the centre blocks and falls away to finished khaki walls; 2.6 to 3.5 s the left
  blocks' walls fade in over the open frames (soft and semi-transparent in stills, about 0.8 s); 4 to 5.5 s last netting and both
  cranes go; 6 to 8 s static stage 5. Floors hold (full-res crops at 3.0 s and 7.94 s: stilts + 5 floors + terrace, nothing taller,
  no invented block). Ends: first frame MAD 7.8 vs stage-4-aligned, last 7.0 vs stage-5-aligned (closest of all takes). Blemish: a
  faint hatched texture on the front-right block's parapet in the final second.
- 2026-10-23 17:07 `_source/generated/video/hero/SEG34_READY.json` WRITTEN (provisional): segments seg3-omni-aligned-3b, seg4-veo-aligned-4b,
  seg4b-glide (1.5 s) with xfades 0.5 / 0.5 / 0.25, picks with verdicts, alternates, rejected. Checked with assemble_hero.load_edit
  (seg2-veo + these + seg5-omni-sa load fine). Update it if a queued take beats a pick.
- 2026-10-23 17:07 seg4-omni-aligned-4c DONE: FAIL. Wrap-in-netting-then-reveal works right to left with no ghosting, but the
  front-right block beside the road shrinks away 0.12 to 0.31 s and pops back finished at 4.79 s. Prompt 4d = 4c + "every block
  stays visible in every frame". Queue now (after `run 3 veo 3b -3b`, started 17:07, Veo operation
  16676bf0-7a28-4dc3-a22b-b655ca26724f): `run 4 omni 4d -4d`, `run 3 omni 3c -3c`, `run 4 veo 4d -4d`. Next idea for a cleaner seg4: prompt 4c
  (each block is wrapped in netting, then the netting drops away to reveal the finished block, right to left, nothing fades).

## Next steps (in order, one model request at a time)
1. Frame-check seg3 Veo by eye (rebuild the strip if the scratchpad is gone):
   `... hero_video_aligned.py review seg3-veo-aligned 3`
2. `... hero_video_aligned.py run 3 omni 3a` · 3. `... run 4 veo 4a` · 4. `... run 4 omni 4a`
   (`...` = `GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow
   --with google-cloud-storage --with imageio-ffmpeg --with opencv-python-headless --with numpy python tools/imagegen/hero_video_aligned.py`).
   A take passes if the check shows max shift under about 10 px and no lost frames, and the strip shows no invented building and the
   right floors. On a fail add prompt keys 3b/4b in PROMPTS and rerun with a suffix (`run 3 veo 3b -r2`), at most 3 per engine.
5. Write `_source/generated/video/hero/SEG34_READY.json` (passing takes: path, engine, duration; plus seg4b-glide.mp4 1.5 s and the
   2 s variant), append a review-notes row to docs/IMAGEGEN_LOG.md, report.

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
