# Hero B handoff (Sonnet): seg5, assemble_hero.py, web encodes

PAUSED 2026-10-22 14:33 IST by the coordinator (usage 73%). Nothing is committed. No new model job is queued.
The scratchpad hero-b folder gets purged (it was on 10-22 00:01), so everything needed is in tools/imagegen/ and _source/generated/ (previews: `_source/generated/video/hero/previews/`).

## IN FLIGHT (do not wait for it)
- One Omni call is still running, started 14:31 IST: `seg5-omni-sb2` (prompt SB2, first `seg5-mid1`, last `ss01`, 8 s, light-glare variant of step B). Omni calls are synchronous POSTs (no operation name). When the process finishes it writes `_source/generated/video/hero/seg5-omni-sb2.mp4` (+ `.prompt.txt`), copies it to `gs://parshwanath-infra-veo/review/hero/seg5-omni-sb2.mp4`, appends a row to docs/IMAGEGEN_LOG.md and makes a preview in the scratchpad. If the process died, the raw clip (with audio) lands in `gs://parshwanath-infra-veo/review/hero/omni-raw/` (newest object). Not yet frame-checked.
- CANCELLED before starting (driver killed on the pause order): `seg5-omni-b` (prompt B, direct stage-5 to ss01, blocks complete themselves), `seg5-veo-sa` (prompt SA, stage-5 to seg5-mid1), `seg5-veo-sb1` (prompt SB1, seg5-mid1 to ss01). Commands below.

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
1. Frame-check seg5-omni-sb2 when it lands (`review` + `strip` below). Optional, only if usage allows: omni-b, veo-sa, veo-sb1 (max 3 attempts per engine; Veo has used 1, Omni 4 incl. the mid steps).
2. Write `tools/imagegen/hero_edit.json` (final) and `hero_edit_provisional.json` (seg1-omni, seg2-veo, 1.5 s crossfade into seg5 = sa + sb1 pieces, name `hero-provisional`, no poster or sequence, suffix `-provisional`). Final needs seg3, seg4, seg4b-glide from Lead A (`SEG34_READY.json`).
3. Build: master, web (full and short cut), poster, sequence, `public/video/hero/manifest.json`; phone previews under 6 MB and 10-frame contact strips via `--preview-dir`; upload masters (`--only upload`); append review notes and the assembly note to docs/IMAGEGEN_LOG.md; delete zz-test files.

## Commands (run from the project folder, quote the path, it ends with a space)
```
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
export GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent
U=~/.local/bin/uv
GEN="$U run --no-project --python 3.12 --with google-genai --with pillow --with google-cloud-storage --with imageio-ffmpeg --with numpy python"
# frame-check a take (preview under 2 MB + 6-still strip go to the scratchpad hero-b dir; copy them to previews/ afterwards)
$GEN tools/imagegen/hero_seg5.py review seg5-omni-sb2
$GEN tools/imagegen/hero_seg5.py strip seg5-omni-sb2 seg5-omni-sb2-dense 12 3 560 1.0 4.0
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
