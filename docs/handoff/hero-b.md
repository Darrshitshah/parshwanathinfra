# Hero B handoff (Sonnet): seg5, assemble_hero.py, web encodes

## 2026-10-28 FINISHER (new session, Sonnet): verify joins, build web outputs
- [x] step 1: assemble_hero.py --selftest passes (no fix needed). hero-master.mp4 (40.67 s, 3840x2160, 24 fps, 381 MB) and hero-short-master.mp4 (22.08 s, 254 MB) are complete, newer than hero_edit.json and assembler, durations match the edit list (40.65 s / 22.08 s). No rebuild needed unless trims change.
- [x] PREVIEWS READY 2026-10-28 (join-checked masters, coordinator priority request): phone preview `/Users/darshit/CLAUDE the GOD/Parshwanath portfolio /_source/generated/video/hero/previews/hero-phone.mp4` (full cut 37.9 s, 4.89 MB) and `hero-short-phone.mp4` (short cut 20.8 s, 2.95 MB); 10-frame contact strips `previews/hero-contact.jpg` and `previews/hero-short-contact.jpg`. Web encodes still running in the background.
- [x] step 3 DONE 2026-10-28: web outputs built in one run. public/video/hero: hero-desktop.mp4 5.93 MB, hero-desktop.webm 5.32 MB, hero-mobile.mp4 3.46 MB, hero-mobile.webm 3.09 MB, hero-short-desktop.mp4 2.86 MB, hero-short-desktop.webm 2.85 MB, hero-short-mobile.mp4 1.88 MB, hero-short-mobile.webm 1.78 MB, hero-poster.webp 190 KB, hero-poster.avif 173 KB, hero-poster-start.webp 189 KB, hero-poster-start.avif 188 KB, manifest.json 4.9 KB (30 MB total). public/sequences/hero: 120 WebP frames at 1280 w, 5.5 MB, manifest.json (short cut, 20.79 s). Full cut 37.92 s, short cut 20.79 s. Both masters and all web files uploaded to gs://parshwanath-infra-veo/review/hero/.
- [x] step 4 DONE: all zz-test files deleted (public/video/hero, public/sequences/hero-zz-test, _source zz-test-master.mp4).
- NOT WIRED into the site (director reviews the cut first). tsconfig.json untouched. FYI: git shows public/3d/* and public/sequences/diorama/* as deleted in the working tree; that was not done by this job (only hero-zz-test was removed here); restore with git checkout if unintended.
- [x] step 2 DONE 2026-10-28 (masters rebuilt: hero-master.mp4 37.92 s 350 MB, hero-short-master.mp4 20.79 s 232 MB; every join re-read in dense strips, no camera jump, no ghost longer than its crossfade, floors unchanged, no invented building; motion curve max camera shift 1.3 px at 4K, no pop). Details: full-cut joins J1 (seg1/seg2), J3 (seg3/seg4), J4, J5, J6 (bloom), J7 checked on the old master and PASS (same camera, no pops). FOUND: seg2-veo itself morphs from the stage-2 framing to the stage-3 framing at 5.9-6.9 s (ghost plus a jerk at 6.67-6.88 s, truck teleports). FIX applied in hero_edit.json: seg2 out 5.75 (full) / 5.8 at 2x (short), crossfade into seg3 1.0 s (full) / 0.8 s (short). Masters must be rebuilt (--only master) and J2 re-checked; the new full cut is about 37.9 s. Old sequence of checks: (full joins at film time 7.5-8.0, 15.0-15.5, 21.1-21.6, 27.35-27.6, 28.6-28.85, 35.6-36.6, 37.65-38.85) · [ ] step 3 web outputs, preview, strip, upload · [ ] step 4 delete zz-test · [ ] step 5 final report

## 2026-10-23 RESUMED (Hero B, Sonnet): assembling the final film
Brief: assemble seg1-omni, seg2-veo, SEG34_READY (seg3-omni-aligned-3b, seg4-veo-aligned-4b, seg4b-glide), seg5 from the takes on disk (no new model calls); do NOT wire into the site. Checkpoints, newest last:
- [x] 22:35 IST edit written: `tools/imagegen/hero_edit.json` (full cut about 40.7 s, short cut about 22.3 s; masters 3840x2160). seg5 = seg5-omni-sa, then my own 1.0 s bloom dissolve straight into seg5-omni-sb1 from 2.25 s (the model's warped ghost frames at 1.70 to 2.25 s are never used), then a 1.2 s dissolve into the real `frames-4k/ss01.jpg` held as a still (so the film ends exactly on SS-01; sb1's last frames already match its pose within 5 px at 3840, only tone differs). Assembler gained: stills as segments (anchor = never colour-matched), poster of the first frame (`hero-poster-start`), chapter merging, `master.crf`.
- [ ] masters built (4K) · [ ] web encodes · [ ] poster, sequence, manifest · [ ] joins checked on the 4K masters · [ ] phone preview + contact strip · [ ] upload to the review bucket · [ ] zz-test files deleted
Helper tools written this session (all in `tools/imagegen/`): `hero_strip.py` (labelled frame grids, crops, any video), `hero_motion.py` (per-frame difference and camera-shift curve, finds pops and jumps).

PAUSED 2026-10-22 14:33 IST by the coordinator (usage 73%), updated 14:45. Nothing is committed. No model job is running or queued.
The scratchpad hero-b folder gets purged (it was on 10-22 00:01), so everything needed is in tools/imagegen/ and _source/generated/ (previews: `_source/generated/video/hero/previews/`).

## IN FLIGHT
Nothing. The last Omni call, `seg5-omni-sb2` (prompt SB2, seg5-mid1 to ss01, glare variant), FAILED at 14:43 with HTTP 500 "Internal error encountered" (twice: the first request and the script's one built-in retry 60 s later, which fired after the pause order because it is part of the same job). It is logged as a failure in docs/IMAGEGEN_LOG.md; no clip was produced. No other job was started: `seg5-omni-b` (prompt B, direct stage-5 to ss01, blocks complete themselves), `seg5-veo-sa` (SA, stage-5 to seg5-mid1) and `seg5-veo-sb1` (SB1, seg5-mid1 to ss01) never ran (driver killed). Commands to run them, and to retry sb2, are below.

## Done (on disk)
| What | Path | Size |
|---|---|---|
| Midpoint keyframe (Nano Banana 2.1, stage-5 content from a higher SS-01-like viewpoint) | `_source/generated/hero-keyframes/seg5-mid1.png` (+ prompt), video input `_source/generated/hero-keyframes/frames-4k/seg5-mid1.jpg` | 22.6 MB / 2.8 MB |
| Omni A, direct stage-5 to ss01 | `_source/generated/video/hero/seg5-omni-a.mp4` | 63.1 MB |
| Veo A, direct stage-5 to ss01 | `_source/generated/video/hero/seg5-veo-a.mp4` | 90.9 MB |
| Omni step A, stage-5 to seg5-mid1 | `_source/generated/video/hero/seg5-omni-sa.mp4` | 43.5 MB |
| Omni step B, seg5-mid1 to ss01 | `_source/generated/video/hero/seg5-omni-sb1.mp4` | 30.9 MB |
| Review previews (720 px, under 2 MB) and strips of all of the above | `_source/generated/video/hero/previews/` (seg5-omni-a, seg5-veo-a, seg5-omni-sa, seg5-omni-sb1: .mp4 about 0.5 to 1.4 MB, `*-strip.jpg`, `*-dense.jpg`) | |
| All takes copied to `gs://parshwanath-infra-veo/review/hero/` | | |
| Generation script (subcommands take, mid, review, strip) | `tools/imagegen/hero_seg5.py` (prompts A, B, C, SA, SB1, SB2 inside) | new file |
| Assembly tool | `tools/imagegen/assemble_hero.py` (`--selftest` passes) | new file |
| Log rows | `docs/IMAGEGEN_LOG.md` (mid1, omni-a, veo-a, omni-sa, omni-sb1; review notes still to append) | |

## Take verdicts (frame-checked 10-22 with 6-still and dense strips)
- seg5-omni-a: PASS WITH CAUTION. 0 to 2.4 s stage-5 layout with a slow forward push (closer, not a rise); 0.6 s ghost dissolve at 2.5 to 3.1 s between two camera poses; 3.1 to 8 s a clean SS-01 layout rising to the exact SS-01 framing (final frame MAE 9.6 vs ss01.jpg). No floor changes, no melting.
- seg5-veo-a: PASS WITH CAUTION, weaker. 0 to 1.7 s clean slow rise and pull-back over stage 5 (the requested move); 0.7 s ghost dissolve at 1.7 to 2.4 s; invented big block in the lower-left corner from 2.0 to about 4.8 s; final frame MAE 18.9 vs ss01 (pose off).
- seg5-omni-sa (stage-5 to mid1): PASS. Clean, no ghosting: the camera barely moves, the township stays solid, surroundings turn from open fields to lush tree cover and the highway runs to the horizon (a good "township matures" beat). Ends near mid1 (MAE 9.1 vs the start of sb1).
- seg5-omni-sb1 (mid1 to ss01): PASS WITH CAUTION. Aligned same-camera shot; layout swaps in a 0.55 s ghost dissolve at 1.68 to 2.23 s, clean either side; reaches ss01 framing by 3 s (final frame MAE 9.6 vs ss01) then is static for 5 s.
- Older seg5-veo.mp4 (10-12): clean lift 0 to 2.7 s, long ghost dissolve 2.7 to 5.3 s, final frame MAE 22.7 vs ss01. Superseded.
- Both engines swap the layout with a cross-dissolve; none grows new blocks. Best honest seg5 so far: seg5-omni-sa, then seg5-omni-sb1 cut in two pieces ([0, 1.70] and [2.25, 6.0]) joined by my own 0.5 to 0.9 s dissolve (`"style": "bloom"` optional) so the model's warped ghost frames are not used. Sb2 (glare) may give a natural cover.
- Picks for the rest (strips checked): seg1 = seg1-omni (roads draw themselves progressively; Veo pops them in between 1.6 and 3.2 s); seg2 = seg2-veo (plinths, trucks and haze evolve over the whole 8 s and match stage 3; Omni is front-loaded and static for its last 3 s). The seg1/seg2 join is seamless (same stage-2 camera). SEG34_READY.json from Lead A did not exist on 10-22 14:17.

## Assembler state (tools/imagegen/assemble_hero.py)
Tested on a 15.5 s test cut (seg1-veo + seg2-omni): master render 27 s (CRF 14, 63 MB; 38 s is about 155 MB, in _source/); colour match gammas stayed within 1 to 2 percent; join seamless; web encodes took 4 min 49 s; poster, sequence, manifest, phone preview all work.
- Web sizes at 3 MB desktop / 2 MB mobile on the 15.5 s test: desktop mp4 2.94 MB (SSIM 0.900, VMAF 73.3), desktop webm 2.89 MB (0.906 / 82.8), mobile mp4 1.96 MB (0.918 / 79.8), mobile webm 1.92 MB (0.925 / 86.8). VP9 beats x264 by 6 to 9 VMAF at equal size. A 38 s film at 3 MB is about 0.63 Mbps: too low, so hold the 20 to 24 s short cut to 3 MB and give the full cut a larger budget (about 6 MB) in the edit list `web` block.
- Poster: WebP falls back from 1920 to 1600 wide to stay under 200 KB (190 KB at q71); AVIF alternative at 1920 wide (173 KB at q53) is written too.
- Sequence: 120 frames at 1280 w. Bare-earth frames needed a 1.5 px pre-blur to reach 5.56 MB at WebP q62 (soft). Comparison sheet `_source/generated/video/hero/previews/seq-variants.png` (no blur q12 is 51 KB per frame, blur 1.5 q62 is 46 KB per frame, budget is 48 KB per frame): decide whether low quality without blur looks better; `SEQ_BLURS` / `SEQ_MIN_Q` in the tool control it. Frames of the finished township may compress better.
- Edit list schema is in the module docstring (segments with in, out, speed, xfade, style dissolve|bloom, label; per-cut web budgets; poster source; sequence dir; manifest name).

## Test artefacts named zz-test (safe to delete)
`_source/generated/video/hero/zz-test-master.mp4` (60.5 MB); `public/video/hero/zz-test-{desktop.mp4 2.94 MB, desktop.webm 2.89 MB, mobile.mp4 1.96 MB, mobile.webm 1.92 MB, poster.webp 190 KB, poster.avif 173 KB, manifest.json}`; `public/sequences/hero-zz-test/` (120 WebP frames, 5.6 MB). No other file in public/ was written; `public/video/hero/manifest.json` and `public/sequences/hero/` do not exist yet.

## Not done yet (in order)
1. Optional, only if usage allows: retry sb2 (Omni returned HTTP 500 twice, may be transient), omni-b, veo-sa, veo-sb1 (max 3 attempts per engine; Veo has used 1, Omni 4 incl. the mid steps). Otherwise go straight to step 2 with the takes on disk.
2. Write `tools/imagegen/hero_edit.json` (final) and `hero_edit_provisional.json` (seg1-omni, seg2-veo, 1.5 s crossfade into seg5 = sa + sb1 pieces, name `hero-provisional`, no poster or sequence, suffix `-provisional`). Final needs seg3, seg4, seg4b-glide from Lead A (`SEG34_READY.json`).
3. Build: master, web (full and short cut), poster, sequence, `public/video/hero/manifest.json`; phone previews under 6 MB and 10-frame contact strips via `--preview-dir`; upload masters (`--only upload`); append review notes and the assembly note to docs/IMAGEGEN_LOG.md; delete zz-test files.

## Commands (run from the project folder, quote the path, it ends with a space)
```
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
export GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent
U=~/.local/bin/uv
GEN="$U run --no-project --python 3.12 --with google-genai --with pillow --with google-cloud-storage --with imageio-ffmpeg --with numpy python"
# frame-check a take (preview under 2 MB + 6-still strip go to the scratchpad hero-b dir; copy them to previews/ afterwards)
$GEN tools/imagegen/hero_seg5.py review <take-name>
$GEN tools/imagegen/hero_seg5.py strip <take-name> <out-name> 12 3 560 1.0 4.0
# retry of the failed glare step, then the cancelled jobs
$GEN tools/imagegen/hero_seg5.py take omni seg5-omni-sb2 SB2 seg5-mid1 ss01 8
# cancelled jobs (each about 4 to 6 min, one at a time; take <omni|veo> <name> <prompt-key> <first> <last> <seconds>)
$GEN tools/imagegen/hero_seg5.py take omni seg5-omni-b B stage-5 ss01 8
$GEN tools/imagegen/hero_seg5.py take veo seg5-veo-sa SA stage-5 seg5-mid1 8
$GEN tools/imagegen/hero_seg5.py take veo seg5-veo-sb1 SB1 seg5-mid1 ss01 8
# assembly (edit list JSON, see the docstring)
$U run --no-project --python 3.12 --with pillow --with numpy --with imageio-ffmpeg --with google-cloud-storage python tools/imagegen/assemble_hero.py tools/imagegen/hero_edit.json --only master,web,poster,sequence,manifest --preview-dir <dir>
$U run --no-project --python 3.12 --with pillow --with numpy --with imageio-ffmpeg --with google-cloud-storage python tools/imagegen/assemble_hero.py --selftest
```
Note: in zsh a `while read` loop that runs ffmpeg or uv needs `< /dev/null` on the command or ffmpeg eats the loop input.
Rules: no commits, never commit `_source/`, revert tsconfig.json auto-edits (`git checkout -- tsconfig.json`), keep test encodes named zz-test, no em or en dashes, do not touch src/ or marketing/.
