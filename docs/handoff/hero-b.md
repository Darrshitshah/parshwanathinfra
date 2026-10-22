# Hero B handoff (Sonnet): seg5, assemble_hero.py, web encodes

Last updated 2026-10-22 14:26 IST (resumed after the 10-17 usage cut). Nothing is committed.
IN FLIGHT (started 14:21 IST): background queue `scratchpad/hero-b/queue2.sh` runs Omni step A (`seg5-omni-sa`: stage-5 to seg5-mid1, 8 s) then step B (`seg5-omni-sb1`: seg5-mid1 to ss01, 8 s). Omni calls are synchronous POSTs (no operation name); each takes about 5 min and writes `_source/generated/video/hero/<name>.mp4`; if the process dies the raw clip (with audio) is in `gs://parshwanath-infra-veo/review/hero/omni-raw/`. Check `scratchpad/hero-b/queue.log` and docs/IMAGEGEN_LOG.md for the rows.
The scratchpad hero-b folder was purged at 2026-10-22 00:01 (only empty dirs remain), so every helper script lives in tools/imagegen/ now.

## Done (all on disk)
| What | Path | Size |
|---|---|---|
| Midpoint keyframe (Nano Banana 2.1, strict edit, stage-5 content from a higher, SS-01-like viewpoint) | `_source/generated/hero-keyframes/seg5-mid1.png` (+ `.prompt.txt`), 4K JPG for video input: `_source/generated/hero-keyframes/frames-4k/seg5-mid1.jpg` | 22.6 MB / 2.8 MB |
| Seg5 Omni take A (stage-5 to ss01, 8 s, 4K, prompt A) | `_source/generated/video/hero/seg5-omni-a.mp4` (+ `.prompt.txt`) | 63.1 MB |
| Seg5 Veo take A (same prompt, retry of the 10-12 take) | `_source/generated/video/hero/seg5-veo-a.mp4` (+ `.prompt.txt`) | 90.9 MB |
| Both takes copied to `gs://parshwanath-infra-veo/review/hero/seg5-omni-a.mp4` and `seg5-veo-a.mp4` (Omni raw with audio: `review/hero/omni-raw/`) | | |
| Generation script (take, mid, review sub-commands) | `tools/imagegen/hero_seg5.py` | new file |
| Assembly tool (edit list JSON to master, web encodes, poster, sequence, manifest, preview; `--selftest` passes) | `tools/imagegen/assemble_hero.py` | new file |
| Log rows for the mid keyframe and both takes | `docs/IMAGEGEN_LOG.md` (lines 95 to 97) | review note still to append |

Test artefacts, all named zz-test, safe to delete: `_source/generated/video/hero/zz-test-master.mp4` (60.5 MB), `public/video/hero/zz-test-{desktop.mp4 2.94 MB, desktop.webm 2.89 MB, mobile.mp4 1.96 MB, mobile.webm 1.92 MB}`. Test edit list (seg1-veo + seg2-omni, 15.5 s) is gone with the scratchpad; the format is documented in the assemble_hero.py docstring.

## Findings so far
- Seg5 Omni A: two clean halves. 0 to 2.4 s stage-5 layout with a slow forward push (closer than the first frame, not a rise); a short double-exposure dissolve at about 2.5 to 3.1 s between two different camera poses; 3.1 to 8 s a clean SS-01-layout shot rising from a low oblique view to exactly the SS-01 framing. No melting, floors hold. Verdict: pass with caution (ghost dissolve 0.6 s; camera push then rise reverses direction). Strip from the first look: 6 stills at 0.05, 1.62, 3.20, 4.77, 6.35, 7.92 s.
- Seg5 Veo A (checked 10-22): 0 to 1.7 s clean slow rise and pull-back over the stage-5 layout (the requested move); 1.7 to 2.4 s a 0.7 s ghost dissolve; 2.4 s on the SS-01 layout, but an invented big block sits in the lower-left corner from 2.0 to about 4.8 s (passes out of frame); settles on SS-01 with the final frame MAE 18.9 vs ss01.jpg (pose off). Verdict: pass with caution, weaker than Omni A at the end.
- Omni A final frame vs ss01.jpg MAE 9.6 (close); Veo old take 22.7; Veo A 18.9. Start frames vs stage-5: Veo A 7.6, Omni A 9.6.
- Picks for the other segments (strips checked 10-22): seg1 = seg1-omni (roads draw themselves progressively; the Veo take pops the roads in between 1.6 and 3.2 s). seg2 = seg2-veo (plinths and trucks appear continuously over 8 s and the haze matches stage 3; the Omni take is front-loaded and static for its last 3 s). Join test seg1-veo to seg2-omni was seamless (same camera at stage 2).
- Seg5 Veo 10-12 take (seg5-veo.mp4): clean lift 0 to 2.7 s, long ghost dissolve 2.7 to 5.3 s, clean SS-01 after; its final frame differs from ss01.jpg by MAE 22.8 (pose not exact).
- Both engines solve the layout change with a cross-dissolve. Idea to try: two steps through the midpoint (5 to mid1 is a pure camera move over one layout; mid1 to ss01 is a same-camera dissolve, so ghosting is aligned), and my own bloom dissolve (`"style": "bloom"` in the edit list) to cover the layout swap.
- Colour: Veo clips (untagged) and Omni clips (tagged smpte170m) both decode closest to their keyframes with BT.601, a browser would show the untagged Veo files as BT.709 (slightly orange). assemble_hero.py decodes everything as BT.601 and writes a BT.709 tagged master.
- Encoder test on a 15.5 s cut at 3 MB desktop / 2 MB mobile budgets (SSIM, VMAF): desktop mp4 0.900 / 73.3, desktop webm 0.906 / 82.8, mobile mp4 0.918 / 79.8, mobile webm 0.925 / 86.8. VP9 beats x264 by 6 to 9 VMAF at equal size. A full 38 s film at 3 MB would be about 0.63 Mbps at 1080p: too low, so the 20 to 24 s short cut is the one to hold to 3 MB. Four encodes of a 15.5 s cut took 4 min 49 s.
- Render speed: a 15.5 s master (two 4K clips, colour match, crossfade) took 27 s; master is CRF 14, about 33 Mbps (38 s is about 155 MB, in _source/, gitignored).

## Not done yet
1. Frame-check seg5-veo-a; make the midpoint takes (5 to mid1, mid1 to ss01) and any retries (max 3 per engine); choose the best seg5.
2. Write `tools/imagegen/hero_edit.json` (final list) and a provisional list, build master, web files, poster, sequence, manifest.
3. SEG34_READY.json from Lead A did not exist on 10-22 14:17 (no seg4b-glide.mp4 either). Provisional cut = seg1, seg2, 1.5 s crossfade into seg5 (name `hero-provisional`, no poster or sequence).
4. Phone previews (under 6 MB) and 10-frame contact strips via `--preview-dir`; upload masters to gs://parshwanath-infra-veo/review/hero/ (`--only upload`); append review notes to docs/IMAGEGEN_LOG.md; delete the zz-test files.

## Commands (run from the project folder, quote the path, it ends with a space)
```
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
RUN='~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow --with google-cloud-storage --with imageio-ffmpeg --with numpy python'
export GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent
# frame check of a take: 720 px preview under 2 MB + 6-still strip into the scratchpad hero-b dir
eval $RUN tools/imagegen/hero_seg5.py review seg5-veo-a
# midpoint steps (one request at a time; prompts MID/PROMPTS live in hero_seg5.py, add a key or pass the prompt text)
eval $RUN tools/imagegen/hero_seg5.py take omni seg5-omni-s1 <prompt-key> stage-5 seg5-mid1 4
eval $RUN tools/imagegen/hero_seg5.py take omni seg5-omni-s2 <prompt-key> seg5-mid1 ss01 4
# assembly
eval $RUN tools/imagegen/assemble_hero.py tools/imagegen/hero_edit.json --only master,web,poster,sequence,manifest --preview-dir <scratch>
eval $RUN tools/imagegen/assemble_hero.py --selftest
```
Rules: no commits, never commit `_source/`, revert tsconfig.json auto-edits (`git checkout -- tsconfig.json`), keep test encodes named zz-test, no em or en dashes, do not touch src/ or marketing/.
