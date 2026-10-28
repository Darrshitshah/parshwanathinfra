"""Hero seg3 / seg4 from the camera-consistent (aligned) keyframes on Veo 3.1 and Omni 1.1 Flash (owner: hero lead A).

    GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow \
      --with google-cloud-storage --with imageio-ffmpeg --with opencv-python-headless --with numpy python tools/imagegen/hero_video_aligned.py \
      run <3|4> <veo|omni> <prompt-key> [suffix]                     one take (4K, 8 s, first + last frame, no audio)
      review <name> <3|4>                                             re-run the frame check on an existing take
      ends <name> <3|4>                                               first / last frame vs the keyframes (join quality)
      compare <name> <3|4> [t ...]                                    full-res crops, last keyframe next to the take at t (floor count)
      sheet [SEG34_READY.json] [out.jpg]                              phone review sheet from the "review" list of SEG34_READY.json

seg3: frames-4k/stage-3.jpg -> aligned/stage-4-aligned.jpg; seg4: aligned/stage-4-aligned.jpg -> aligned/stage-5-aligned.jpg.
Outside the site the first and last frames are pixel-identical, so the frame check registers sampled frames to the first keyframe on
that region (SIFT + RANSAC): a locked camera keeps it still, a swoop or cut shows up as a large shift or a lost match.
Originals -> _source/generated/video/hero/seg<N>-<engine>-aligned[suffix].mp4 (+ .prompt.txt) and gs://parshwanath-infra-veo/review/hero/,
6 stills + strip + check.json + 720 px preview (< 2 MB) -> scratchpad hero-a. Every call is logged in docs/IMAGEGEN_LOG.md.
"""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cv2  # noqa: E402
import imageio_ffmpeg  # noqa: E402
import numpy as np  # noqa: E402
from _lib import GEN, PROJECT, VIDEO_MODEL, client, log_call  # noqa: E402

FF = imageio_ffmpeg.get_ffmpeg_exe()
FR = GEN / "hero-keyframes" / "frames-4k"
AL = GEN / "hero-keyframes" / "aligned"
OUT = GEN / "video" / "hero"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-new-a")
NEW = OUT / "new"  # new hero film (2026-10-28): takes for segments >= 10 go here
NK = GEN / "hero-keyframes" / "new"


def outdir(seg):
    return NEW if int(seg) >= 10 else OUT
BUCKET = "parshwanath-infra-veo"
REVIEW = f"gs://{BUCKET}/review/hero/"
OMNI_MODEL = "gemini-omni-1.1-flash-preview"
W, H = 3840, 2160
FRAMES = {3: (FR / "stage-3.jpg", AL / "stage-4-aligned.jpg"), 4: (AL / "stage-4-aligned.jpg", AL / "stage-5-aligned.jpg"),
          # new opening (lead A): one locked stage-3 camera, bare -> roads -> plinths -> frames
          11: (NK / "ka-bare.jpg", NK / "kb-roads.jpg"), 12: (NK / "kb-roads.jpg", FR / "stage-3.jpg"),
          13: (FR / "stage-3.jpg", NK / "km-mid.jpg"), 14: (NK / "km-mid.jpg", AL / "stage-4-aligned.jpg"),
          15: (FR / "stage-3.jpg", AL / "stage-4-aligned.jpg")}  # 15 = the whole 3 -> 4 gap in one take (13/14 split failed: km-mid footprints differ from stage 4)

LOCK = ("Static locked-off camera on a tripod: a construction time-lapse in one continuous shot with no cuts. The camera does not move at all, "
        "no zoom, no pan, no tilt, no push-in, no change of angle. ")
LOCK2 = ("One continuous shot from a fixed camera high above the site, like a webcam: the framing never changes, no zoom, no pan, no tilt, "
         "no push-in, no cuts. ")
PROMPTS = {
    "3a": LOCK + ("The farmland, trees, farm huts, the dirt yard with its trucks and brick stacks, the road on the right and the horizon stay exactly "
                  "still in every frame. Only the buildings inside the site change, in place: over eight seconds the flat concrete plinths grow into raw "
                  "reinforced-concrete frames, floor by floor, columns first then slabs, all blocks rising together at the same slow pace; the row houses "
                  "at the back rise in red brick, two storeys; scaffolding and green safety netting appear on the right-hand blocks and two yellow tower "
                  "cranes rise where the last frame shows them. Every block ends exactly as in the last frame and is never taller than in the last frame. "
                  "No other buildings appear anywhere. Warm golden morning light. No text."),
    "4a": LOCK + ("Everything outside the site stays exactly still in every frame: the farmland, trees and farm huts, the dirt yard with the truck, brick "
                  "stacks and steel bars, the road on the right and the horizon. Only the buildings change, in place: over eight seconds the scaffolding, "
                  "green netting and the two cranes come away, the open concrete frames close with walls and windows, the walls take a warm khaki "
                  "sand-olive paint with white window frames and charcoal railings, and lawns, palms and flowering trees grow in between the blocks. Each "
                  "block ends exactly as in the last frame: an open stilt-parking ground floor, five floors of windows and a roof terrace. No block moves, "
                  "grows taller or appears from nowhere. Warm golden morning light. No text."),
    # 3b (2026-10-23): 3a on Veo invented 8 to 10 storey towers mid-clip that later shrank, and very tall cranes. No "tower", no
    # "columns first", no "construction time-lapse" (stock time-lapses are high-rise), an explicit low-rise rule and height schedule.
    "3b": LOCK2 + ("This is a low-rise housing colony, not high-rise: every block in this scene is long and low and is never taller than six "
                   "levels at any moment, and there are no tall buildings anywhere at any time. The farmland, trees, farm huts, the dirt yard "
                   "with its trucks and brick stacks, the road on the right and the horizon stay exactly still. Over eight seconds each building "
                   "grows straight up from its own white plinth, keeping exactly that footprint, in one even, steady rise of grey concrete frames "
                   "with floor slabs: about one third of its final height by three seconds, two thirds by five seconds, and exactly as in the "
                   "last frame by seven seconds. Heights only ever increase and never pass the last frame. The row houses at the back rise in "
                   "red brick to two storeys. Green safety netting and scaffolding appear on the right-hand blocks, and two yellow construction "
                   "cranes stand where the last frame shows them, no taller than in the last frame. Nothing appears outside the plinths. Warm "
                   "golden morning light. No text."),
    # 3c: 3b passed on Omni but the rise took only 1.5 s (1.25 to 2.75 s); same rules, with the rise spread over the whole clip.
    "3c": LOCK2 + ("This is a low-rise housing colony, not high-rise: every block is long and low and is never taller than six levels at any "
                   "moment, and there are no tall buildings anywhere at any time. The farmland, trees, farm huts, the dirt yard with its trucks "
                   "and brick stacks, the road on the right and the horizon stay exactly still. The construction is slow and continuous through "
                   "the whole eight seconds, never rushed: for the first second only the white plinths, then grey concrete columns and floor "
                   "slabs rise on every plinth one floor at a time, all blocks together, keeping exactly their footprints: a quarter of the final "
                   "height by two and a half seconds, half by four seconds, three quarters by five and a half seconds, and the full height of "
                   "the last frame only at about seven seconds. Heights only ever increase and never pass the last frame. The red-brick row "
                   "houses at the back rise to two storeys over the same time. Scaffolding and green safety netting appear on the right-hand "
                   "blocks in the last two seconds, and two yellow construction cranes stand where the last frame shows them, no taller than in "
                   "the last frame. Nothing appears outside the plinths. Warm golden morning light. No text."),
    # 4b: same rules for seg4; the blocks keep their outline, only their surface is finished in place.
    "4b": LOCK2 + ("Low-rise housing blocks of six levels; there are no tall buildings anywhere at any time. The farmland, trees, farm huts, "
                   "the dirt yard with the truck, brick stacks and steel bars, the road on the right and the horizon stay exactly still. The "
                   "blocks never change their outline or height: from the first frame to the last each one keeps the same footprint and "
                   "roofline, and only its surface is finished in place, a few blocks at a time: the open concrete frames fill with walls and "
                   "windows, the walls take a warm khaki sand-olive paint with white window frames and charcoal railings, the green netting and "
                   "scaffolding disappear, and the two yellow cranes are dismantled and gone by six seconds. Lawns, palms and flowering trees "
                   "appear between the blocks. By the end every block shows an open stilt-parking ground floor, five floors of windows and a "
                   "roof terrace, exactly as in the last frame. Warm golden morning light. No text."),
    # 4c: 4b on Omni cross-dissolved the left blocks (2.8 to 3.1 s). Give the model a physical way to swap a facade: wrap in netting,
    # then the netting drops away to reveal the finished block, group by group from right to left.
    "4c": LOCK2 + ("Low-rise housing blocks of six levels; there are no tall buildings anywhere at any time. The farmland, trees, farm huts, "
                   "the dirt yard with the truck, brick stacks and steel bars, the road on the right and the horizon stay exactly still. No "
                   "block ever changes its outline or height. The finishing moves across the site one group of blocks at a time, from the "
                   "right-hand blocks to the far left: each block is first wrapped in scaffolding and green safety netting, and a moment later "
                   "the netting drops away to reveal the finished block underneath, painted warm khaki sand-olive with white window frames and "
                   "charcoal railings, with an open stilt-parking ground floor, five floors of windows and a roof terrace. The two yellow cranes "
                   "are dismantled and gone by six seconds. Lawns, palms and flowering trees appear between the blocks at the end. Every change "
                   "is solid and physical: nothing fades, blends or turns transparent. By the end everything is exactly as in the last frame. "
                   "Warm golden morning light. No text."),
}
# 4d: 4c on Omni wrapped and revealed nicely but let the front-right block next to the road vanish at 0.2 s and pop back finished at
# 4.8 s. Same mechanism plus an explicit rule that every block stays visible in every frame.
PROMPTS["4d"] = PROMPTS["4c"].replace(
    "No block ever changes its outline or height.",
    "Every block of the first frame stays in place and visible in every frame, including the block at the front right beside the road: "
    "no block ever disappears, shrinks or changes its outline or height, even for a moment.")
# New opening (2026-10-28, lead A): segments 11 (bare -> roads) and 12 (roads -> plinths) in the stage-3 camera.
NEWLOCK = ("A real drone photograph in motion: one continuous 8 second shot from a fixed camera high above a construction site, like a webcam. "
           "The framing never changes: no zoom, no pan, no tilt, no push-in, no cuts. ")
PROMPTS["n1"] = NEWLOCK + ("The farmland, hedgerows, trees, farm huts, the dirt yard with its trucks, brick stacks and sand heaps, the road on the "
                           "right and the horizon stay exactly still. Only the building site changes, in place. It starts as bare levelled earth "
                           "with orange survey lines and pegs. A road-grader, an asphalt paver and a roller work along the survey lines and, over "
                           "eight seconds, the internal roads are laid physically, solid and continuous: a dark asphalt ribbon advances along the "
                           "line from the right-hand entrance towards the far left, then the side roads, then the roundabout, with granite kerbs "
                           "and white lime lines for the future plots appearing behind the machines, and two excavators and a concrete mixer "
                           "truck arriving from the right-hand road and parking where the last frame shows them. A couple of workers in white "
                           "helmets and orange vests walk along the new road, tiny in frame. Nothing is taller than the machines; there are no "
                           "buildings, walls or frames anywhere. Everything ends exactly as in the last frame. Warm golden morning light. No text.")
PROMPTS["n2"] = NEWLOCK + ("The farmland, hedgerows, trees, farm huts, the dirt yard with its trucks, brick stacks and sand heaps, the road on the "
                           "right and the horizon stay exactly still. Only the building site changes, in place. The white lime outlines on the "
                           "ground become foundations: over eight seconds excavators dig the trenches, steel reinforcement bars are laid, "
                           "shuttering goes up and concrete mixer trucks pour, so that grey concrete foundation plinths fill every outlined "
                           "footprint one after another, starting with the front right ones near the entrance and moving to the far left. They "
                           "are flat low slabs only, at most knee to waist high, never walls, columns or frames. Every change is solid and "
                           "physical: nothing fades, blends or turns transparent. The plinths end exactly where the last frame shows them. "
                           "Nothing rises above the machines at any moment and there are no tall buildings anywhere. Warm golden morning light. "
                           "No text.")
# Segments 13 (stage-3 plinths -> two-level frames) and 14 (two-level frames -> stage-4-aligned): the old 3 -> 4 gap split in two with a
# middle keyframe, so heights are pinned at the middle (the one-gap Veo take 3b invented 5 to 6 level blocks mid-clip and swapped them).
PROMPTS["n3"] = NEWLOCK + ("This is a low-rise housing colony, not high-rise: every building is long and low and is never taller than the last "
                           "frame at any moment, and there are no tall buildings anywhere at any time. The farmland, trees, farm huts, the dirt "
                           "yard with its trucks and brick stacks, the roads, the roundabout and the horizon stay exactly still. Over eight "
                           "seconds each building grows straight up from its own white plinth, keeping exactly that footprint, in one even, "
                           "steady rise: grey concrete columns go up first on every plinth, then the floor slab on top of them, so that each "
                           "block gains one open level and then a second, all blocks together at the same slow pace, exactly as in the last "
                           "frame by seven seconds. Heights only ever increase and never pass the last frame. Every change is solid and "
                           "physical: nothing fades, blends or turns transparent, and no building ever shrinks or disappears. Nothing "
                           "appears outside the plinths. Warm golden morning light. No text.")
PROMPTS["n4"] = NEWLOCK + ("This is a low-rise housing colony, not high-rise: every block is long and low and is never taller than the last "
                           "frame at any moment, and there are no tall buildings anywhere at any time. The farmland, trees, farm huts, the dirt "
                           "yard with its trucks and brick stacks, the roads, the roundabout and the horizon stay exactly still. Over eight "
                           "seconds every block keeps its footprint and grows steadily upward, one open level at a time, from two levels to "
                           "exactly the height of the last frame by seven seconds, never beyond it: bare grey concrete columns, beams and "
                           "floor slabs, with brick infill starting on the lower floors. The long low row houses at the back left rise in red "
                           "brick. Scaffolding and green safety netting appear on the right-hand blocks, and two yellow construction cranes "
                           "stand where the last frame shows them, no taller than in the last frame. Every change is solid and physical: "
                           "nothing fades, blends or turns transparent, and no building ever shrinks or disappears. Nothing appears outside "
                           "the blocks. Warm golden morning light. No text.")
# n4b: seg14 take a (Veo n4) shrank the front-left blocks back to plinths at 4.5 to 5.5 s, swapped in other buildings at the back and grew
# cranes that reach the top of the frame. n4b: nothing is built or removed, blocks only gain infill and cladding, cranes stay small.
PROMPTS["n4b"] = NEWLOCK + ("This is a low-rise housing colony, not high-rise: every block is long and low, and there are no tall buildings "
                            "anywhere at any time. Every building that is in the first frame stays exactly where it is, stays visible in "
                            "every frame and never gets lower or smaller, not even for a moment; no building ever shrinks, vanishes or is "
                            "replaced. The farmland, trees, farm huts, the dirt yard with its trucks and brick stacks, the roads, the roundabout "
                            "and the horizon stay exactly still. Over eight seconds the blocks grow slowly and steadily upward, one more open "
                            "level at a time, from the two levels of the first frame to exactly the height of the last frame by seven seconds, "
                            "never beyond it. As they grow, brick infill walls start on the lower floors, the long low row houses at the back "
                            "left fill with red brick, and green safety netting and scaffolding appear on the right-hand blocks. Two small "
                            "yellow construction cranes appear only after five seconds, standing where the last frame shows them, no taller "
                            "than in the last frame. Every change is solid and physical: nothing fades, blends or turns transparent. Nothing "
                            "appears outside the blocks. Warm golden morning light. No text.")
# n5: whole stage-3 -> stage-4-aligned gap, with the physical wording that worked in n1 to n3 (columns, then slabs; nothing fades or shrinks).
PROMPTS["n5"] = NEWLOCK + ("This is a low-rise housing colony, not high-rise: every block is long and low and is never taller than the last "
                           "frame at any moment, and there are no tall buildings anywhere at any time. The farmland, trees, farm huts, the dirt "
                           "yard with its trucks and brick stacks, the roads, the roundabout and the horizon stay exactly still. Over eight "
                           "seconds every building grows straight up from its own white plinth, keeping that footprint, in one even, steady "
                           "rise: first grey concrete columns go up on every plinth, then floor slabs, one open level after another, all blocks "
                           "together at the same slow pace, with brick infill starting on the lower floors, the long low row houses at the back "
                           "left rising in red brick, and green safety netting and scaffolding appearing on the right-hand blocks in the last "
                           "three seconds. Two yellow construction cranes appear only in the last three seconds, standing where the last frame "
                           "shows them, no taller than in the last frame. Every block ends exactly as in the last frame by seven seconds and "
                           "never grows beyond it. Every change is solid and physical: nothing fades, blends or turns transparent, and no "
                           "building ever shrinks or disappears. Nothing appears outside the plinths. Warm golden morning light. No text.")
NEG = ("camera movement, zoom, push-in, dolly, pan, tilt, orbit, fly-through, cut, scene change, close-up, towers, skyscrapers, high-rise, "
       "tall buildings, extra floors, buildings shrinking, giant cranes, new buildings, buildings outside the site, morphing, melting, "
       "ghosting, double exposure, cross-dissolve, transparent buildings, text, letters, logos, watermark, flicker, people close to camera")
OMNI_HEAD = "The first image is the first frame and the second image is the last frame. "
OMNI_TAIL = (" No audio. Avoid: camera movement, zoom, cuts, close-ups, new buildings, towers, high-rise, extra floors, buildings shrinking, "
             "ghosting, transparent or cross-dissolving buildings, text, logos, flicker.")
TRANSIENT = ("429", "RESOURCE_EXHAUSTED", "500", "INTERNAL", "503", "UNAVAILABLE", "Internal error")
VEO_TRANSIENT = ("high load", "'code': 8,", "'code': 13,", "'code': 14,")
VEO_ATTEMPTS, VEO_PAUSE = 3, 120


def retry(fn, tries=4, first_wait=30.0):
    """Exponential backoff on 429 / 5xx (one request at a time)."""
    wait = first_wait
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001
            if i < tries - 1 and any(t in str(e) for t in TRANSIENT):
                print(f"  transient error, retry in {wait:.0f}s: {str(e)[:140]}", flush=True)
                time.sleep(wait)
                wait *= 2
                continue
            raise


def to_gcs(path, key):
    from google.cloud import storage
    storage.Client(project=PROJECT).bucket(BUCKET).blob(key).upload_from_filename(str(path))


def from_gcs(uri, dest):
    from google.cloud import storage
    bkt, _, key = uri[5:].partition("/")
    storage.Client(project=PROJECT).bucket(bkt).blob(key).download_to_filename(str(dest))


def veo(first, last, prompt, dest, enhance=True):
    from google.genai import types

    def cfg(enh):
        return types.GenerateVideosConfig(aspect_ratio="16:9", resolution="4k", duration_seconds=8, number_of_videos=1, generate_audio=False,
                                          enhance_prompt=enh, compression_quality="OPTIMIZED", negative_prompt=NEG, person_generation="allow_adult",
                                          last_frame=types.Image(image_bytes=last.read_bytes(), mime_type="image/jpeg"))
    c = client("us-central1")
    img = types.Image(image_bytes=first.read_bytes(), mime_type="image/jpeg")
    enhance = True  # Veo 3 refuses enhance_prompt=False ("Veo 3 prompt enhancement cannot be disabled", 2026-10-22)
    op = retry(lambda: c.models.generate_videos(model=VIDEO_MODEL, prompt=prompt, image=img, config=cfg(enhance)))
    print("  veo operation:", op.name, flush=True)
    while not op.done:
        time.sleep(15)
        op = c.operations.get(op)
    if op.error or not op.response or not op.response.generated_videos:
        raise RuntimeError(f"veo: {op.error or getattr(op.response, 'rai_media_filtered_reasons', 'no video')}")
    dest.write_bytes(op.response.generated_videos[0].video.video_bytes)
    return VIDEO_MODEL, prompt, f"enhance_prompt={enhance} negative_prompt={NEG}"


def omni(first, last, prompt, dest):
    import omni as O
    full = OMNI_HEAD + prompt + OMNI_TAIL
    rf = [{"type": "video", "delivery": "uri", "gcs_uri": REVIEW + "omni-raw/", "aspect_ratio": "16:9", "resolution": "4k", "duration": "8s"}]
    content = [{"type": "text", "text": full}, {"type": "image", "data": O.b64(first), "mime_type": "image/jpeg"},
               {"type": "image", "data": O.b64(last), "mime_type": "image/jpeg"}]
    j, _ = retry(lambda: O.ia(content, response_format=rf, gen_cfg={"video_config": {"task": "image_to_video"}}, timeout=900), first_wait=60.0)
    uri = None
    for st in j.get("steps", []):
        for c in (st.get("content", []) if st.get("type") == "model_output" else []):
            if c.get("type") == "video" and c.get("uri"):
                uri = c["uri"]
    if not uri:
        raise RuntimeError(f"omni: no video uri, status={j.get('status')}")
    print("  omni output:", uri, flush=True)
    tmp = dest.with_name(dest.stem + "-audio.mp4")
    from_gcs(uri, tmp)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(tmp), "-an", "-c:v", "copy", str(dest)], check=True)
    tmp.unlink()
    return OMNI_MODEL, full, f"raw={uri}"


# ---------- frame check ----------

def grab(src, t, w=1280):
    r = subprocess.run([FF, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(src), "-frames:v", "1", "-vf", f"scale={w}:-2",
                        "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, check=True)
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)


def duration(src):
    import re
    r = subprocess.run([FF, "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def env_mask(seg, w=1280):
    """Pixels outside the site in both keyframes of the segment (identical in first and last frame), sky excluded."""
    a4 = cv2.imread(str(AL / "stage-4-alpha.png"), cv2.IMREAD_GRAYSCALE)
    env = (a4 == 0)
    if seg == 4:
        env &= cv2.imread(str(AL / "stage-5-alpha.png"), cv2.IMREAD_GRAYSCALE) == 0
    env = env.astype(np.uint8)
    env[: int(H * 0.15)] = 0
    env = cv2.erode(env, np.ones((41, 41), np.uint8))
    return cv2.resize(env, (w, round(w * 9 / 16)), interpolation=cv2.INTER_NEAREST)


def lock_check(src, seg, step=0.5, w=1280):
    sift = cv2.SIFT_create(nfeatures=6000)
    mask = env_mask(seg, w)
    ref = cv2.resize(cv2.imread(str(FRAMES[seg][0])), (w, round(w * 9 / 16)), interpolation=cv2.INTER_AREA)
    gref = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    kr, dr = sift.detectAndCompute(gref, mask)
    bf = cv2.BFMatcher(cv2.NORM_L2)
    s = W / w
    corners = np.float32([[0, 0], [w, 0], [w, ref.shape[0]], [0, ref.shape[0]]]).reshape(-1, 1, 2)
    rows = []
    t = 0.0
    dur = duration(src)
    while t <= dur - 0.04:
        f = grab(src, min(t, dur - 0.06), w)
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        kf, df = sift.detectAndCompute(g, mask)
        shift, inl = None, 0
        if df is not None and len(kf) > 20:
            good = [m for m, n in (x for x in bf.knnMatch(df, dr, k=2) if len(x) == 2) if m.distance < 0.75 * n.distance]
            if len(good) >= 12:
                Hm, ok = cv2.findHomography(np.float32([kf[m.queryIdx].pt for m in good]), np.float32([kr[m.trainIdx].pt for m in good]),
                                            cv2.USAC_MAGSAC, 2.5)
                if Hm is not None:
                    inl = int(ok.sum())
                    shift = float(np.abs(cv2.perspectiveTransform(corners, Hm) - corners).reshape(-1, 2).max() * s)
        mad = float(np.abs(cv2.GaussianBlur(g, (0, 0), 2).astype(np.float32) - cv2.GaussianBlur(gref, (0, 0), 2).astype(np.float32))[mask > 0].mean())
        rows.append(dict(t=round(t, 2), shift_px=None if shift is None or inl < 25 else round(shift, 1), inliers=inl, env_mad=round(mad, 2)))
        t += step
    valid = [r["shift_px"] for r in rows if r["shift_px"] is not None]
    lost = [r["t"] for r in rows if r["shift_px"] is None]
    return dict(max_shift_px=max(valid) if valid else None, lost_at=lost, max_env_mad=max(r["env_mad"] for r in rows), rows=rows)


def stills(name, src, n=6):
    fdir = SCR / "frames"
    fdir.mkdir(parents=True, exist_ok=True)
    dur = duration(src)
    ts = [0.05 + (dur - 0.13) * i / (n - 1) for i in range(n)]
    tiles = []
    for i, t in enumerate(ts):
        im = grab(src, t, 1280)
        cv2.imwrite(str(fdir / f"{name}-{i}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 88])
        tile = cv2.resize(im, (640, 360), interpolation=cv2.INTER_AREA)
        cv2.rectangle(tile, (0, 0), (92, 22), (0, 0, 0), -1)
        cv2.putText(tile, f"t={t:.2f}s", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        tiles.append(tile)
    strip = np.vstack([np.hstack(tiles[:3]), np.hstack(tiles[3:6])])
    cv2.imwrite(str(fdir / f"{name}-strip.jpg"), strip, [cv2.IMWRITE_JPEG_QUALITY, 86])
    return fdir / f"{name}-strip.jpg"


def dense(name, src, step=0.5, cols=3, per_sheet=9, tile=(640, 360), t0=0.0, t1=None, tag="dense"):
    """Frames every `step` seconds as 3x3 sheets (scratchpad hero-a/frames/<name>-<tag><k>.jpg) for the by-eye check."""
    fdir = SCR / "frames"
    fdir.mkdir(parents=True, exist_ok=True)
    dur = duration(src)
    t1 = dur if t1 is None else min(t1, dur)
    ts = [min(t0 + i * step, dur - 0.06) for i in range(int((t1 - t0) / step + 1e-6) + 1)]
    tiles = []
    for t in ts:
        tl = cv2.resize(grab(src, t, tile[0]), tile, interpolation=cv2.INTER_AREA)
        cv2.rectangle(tl, (0, 0), (100, 24), (0, 0, 0), -1)
        cv2.putText(tl, f"t={t:.2f}s", (4, 17), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1)
        tiles.append(tl)
    paths = []
    for k in range(0, len(tiles), per_sheet):
        chunk = tiles[k:k + per_sheet]
        chunk += [np.zeros_like(tiles[0])] * (-len(chunk) % cols)
        sheet = np.vstack([np.hstack(chunk[r:r + cols]) for r in range(0, len(chunk), cols)])
        p = fdir / f"{name}-{tag}{k // per_sheet}.jpg"
        cv2.imwrite(str(p), sheet, [cv2.IMWRITE_JPEG_QUALITY, 86])
        paths.append(p)
    return paths


def jumps(src, w=256):
    """Every frame, small and grey: mean absolute change from the previous frame. A cut or a pop shows up as a spike."""
    h = w * 9 // 16
    r = subprocess.run([FF, "-loglevel", "error", "-i", str(src), "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                       capture_output=True, check=True)
    fr = np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w).astype(np.float32)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    fps = len(fr) / duration(src)
    med = float(np.median(d))
    spikes = [dict(t=round((i + 1) / fps, 2), mad=round(float(v), 2)) for i, v in enumerate(d) if v > max(3 * med, med + 3)]
    return dict(frames=len(fr), median_frame_change=round(med, 2), max_frame_change=round(float(d.max()), 2),
                max_at=round((int(d.argmax()) + 1) / fps, 2), spikes=spikes)


def ends(src, seg, w=960):
    """Mean absolute difference (0..255) of the take's first / last frame against the segment's keyframes, whole frame and site only.
    Small numbers mean the joins to the neighbouring segments will not jump."""
    dur = duration(src)
    hh = round(w * 9 / 16)
    site = cv2.resize((cv2.imread(str(AL / "stage-4-alpha.png"), cv2.IMREAD_GRAYSCALE) > 0).astype(np.uint8), (w, hh),
                      interpolation=cv2.INTER_NEAREST) > 0
    out = {}
    for tag, t, kf in (("first", 0.0, FRAMES[seg][0]), ("last", dur - 0.06, FRAMES[seg][1])):
        a = grab(src, t, w).astype(np.float32)
        b = cv2.resize(cv2.imread(str(kf)), (w, hh), interpolation=cv2.INTER_AREA).astype(np.float32)
        d = np.abs(a - b).mean(axis=2)
        out[tag] = dict(vs=kf.name, mad=round(float(d.mean()), 2), mad_site=round(float(d[site].mean()), 2))
    return out


CROPS = {"roof-mid": (1300, 740, 2500, 1040), "lower-left": (150, 1000, 1350, 1600), "lower-mid": (1300, 1380, 2500, 1980),
         "right": (2950, 1000, 3840, 2160)}


def compare(name, seg, t=None):
    """Full-resolution crops for counting floors: the segment's last keyframe (left) next to the take at time t (right, default: end)."""
    src = outdir(seg) / f"{name}.mp4"
    t = duration(src) - 0.06 if t is None else t
    kf = cv2.imread(str(FRAMES[seg][1]))
    fr = grab(src, t, W)
    rows = []
    for tag, (x0, y0, x1, y1) in CROPS.items():
        a, b = kf[y0:y1, x0:x1].copy(), fr[y0:y1, x0:x1].copy()
        for im, lab in ((a, f"keyframe {FRAMES[seg][1].stem}"), (b, f"{name} t={t:.2f}s")):
            cv2.rectangle(im, (0, 0), (12 + 13 * len(lab), 30), (0, 0, 0), -1)
            cv2.putText(im, lab, (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        pair = np.hstack([a, np.zeros((a.shape[0], 12, 3), np.uint8), b])
        rows.append(cv2.resize(pair, (1800, round(pair.shape[0] * 1800 / pair.shape[1])), interpolation=cv2.INTER_AREA))
    p = SCR / "frames" / f"{name}-cmp-{t:.2f}.jpg"
    cv2.imwrite(str(p), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print("compare", p, flush=True)
    return p


def sheet(ready=OUT / "SEG34_READY.json", dest=OUT / "previews" / "seg34-review.jpg", n=6, width=1600):
    """Phone review sheet: keyframe reference row, then for every take in SEG34_READY.json a name + verdict line and a strip of n frames."""
    from PIL import Image, ImageDraw, ImageFont
    spec = json.loads(ready.read_text())
    fb, fr = "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"
    f_h1, f_name, f_txt, f_tag = (ImageFont.truetype(fb, 46), ImageFont.truetype(fb, 32), ImageFont.truetype(fr, 27),
                                  ImageFont.truetype(fb, 19))
    ink, bg, col = (29, 27, 24), (246, 243, 238), {"PASS": (31, 122, 58), "CAUTION": (178, 106, 0), "FAIL": (179, 38, 30)}
    pad, gap = 28, 6
    blocks = []

    def text_block(lines, h_line):
        im = Image.new("RGB", (width, h_line * len(lines) + 8), bg)
        d = ImageDraw.Draw(im)
        for i, (txt, font, fill) in enumerate(lines):
            d.text((pad, 4 + i * h_line), txt, font=font, fill=fill)
        return im

    def wrap(txt, font, maxw):
        words, lines, cur = txt.split(), [], ""
        for wd in words:
            nxt = (cur + " " + wd).strip()
            if font.getlength(nxt) <= maxw:
                cur = nxt
            else:
                lines.append(cur)
                cur = wd
        return lines + ([cur] if cur else [])

    def strip(images, labels):
        k = len(images)
        tw = (width - 2 * pad - (k - 1) * gap) // k
        th = round(tw * 9 / 16)
        im = Image.new("RGB", (width, th + 12), bg)
        d = ImageDraw.Draw(im)
        for i, (fr_img, lab) in enumerate(zip(images, labels)):
            x = pad + i * (tw + gap)
            im.paste(fr_img.resize((tw, th), Image.LANCZOS), (x, 0))
            box = d.textbbox((0, 0), lab, font=f_tag)
            d.rectangle((x, 0, x + box[2] + 10, box[3] + 8), fill=(0, 0, 0))
            d.text((x + 5, 3), lab, font=f_tag, fill=(255, 220, 90))
        return im

    def frames_of(path, times):
        return [Image.fromarray(cv2.cvtColor(grab(path, t, 800), cv2.COLOR_BGR2RGB)) for t in times]

    blocks.append(text_block([(spec.get("sheet_title", "Hero film: seg3 and seg4 takes"), f_h1, ink),
                              (spec.get("sheet_subtitle", ""), f_txt, (90, 86, 80))], 58))
    ref = [(FR / "stage-3.jpg", "stage 3"), (AL / "stage-4-aligned.jpg", "stage 4 aligned"), (AL / "stage-5-aligned.jpg", "stage 5 aligned"),
           (FR / "stage-5.jpg", "stage 5 original")]
    blocks.append(text_block([("Keyframes (approved, the targets)", f_name, ink)], 42))
    blocks.append(strip([Image.open(p).convert("RGB").resize((800, 450), Image.LANCZOS) for p, _ in ref], [lab for _, lab in ref]))
    for item in spec["review"]:
        if "section" in item:  # a group header, e.g. "seg3 · plinths to frames"
            blocks.append(Image.new("RGB", (width, 30), bg))
            hdr = text_block([(item["section"], f_h1, ink)], 56)
            ImageDraw.Draw(hdr).line((pad, hdr.height - 3, width - pad, hdr.height - 3), fill=(190, 182, 170), width=3)
            blocks.append(hdr)
            continue
        path = pathlib.Path(item["file"])
        path = path if path.is_absolute() else GEN.parents[1] / path
        dur = duration(path)
        times = item.get("times") or [0.04 + (dur - 0.12) * i / (n - 1) for i in range(n)]
        status = item["status"]
        lines = [(f"{item['name']}   ·   {status}", f_name, col.get(status, ink))]
        lines += [(ln, f_txt, ink) for ln in wrap(item["verdict"], f_txt, width - 2 * pad)]
        blocks.append(Image.new("RGB", (width, 22), bg))
        blocks.append(text_block(lines, 38))
        blocks.append(strip(frames_of(path, times), [f"{t:.1f}s" for t in times]))
    blocks.append(Image.new("RGB", (width, pad), bg))
    out = Image.new("RGB", (width, sum(b.height for b in blocks)), bg)
    y = 0
    for b in blocks:
        out.paste(b, (0, y))
        y += b.height
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, quality=86, optimize=True, progressive=True)
    print("sheet", dest, out.size, dest.stat().st_size // 1024, "KB", flush=True)
    return dest


def preview(name, src):
    mp4 = SCR / f"{name}.mp4"
    for crf in (24, 26, 28, 30, 32, 34, 36):
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(src), "-an", "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow",
                        "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], check=True)
        if mp4.stat().st_size < 2_000_000:
            break
    return mp4


def review(name, src, seg):
    strip = stills(name, src)
    sheets = dense(name, src)
    mp4 = preview(name, src)
    chk = lock_check(src, seg)
    jmp = jumps(src)
    chk.update(name=name, duration=duration(src), preview=str(mp4), strip=str(strip), dense=[str(p) for p in sheets], jumps=jmp,
               ends=ends(src, seg))
    (SCR / "frames" / f"{name}-check.json").write_text(json.dumps(chk, indent=1))
    print(f"{name}: {chk['duration']:.2f}s | camera shift max {chk['max_shift_px']} px @3840 | lost {chk['lost_at']} | env MAD max "
          f"{chk['max_env_mad']} | frame change median {jmp['median_frame_change']} max {jmp['max_frame_change']} @ {jmp['max_at']}s, "
          f"spikes {jmp['spikes']} | ends {chk['ends']} | preview {mp4.stat().st_size // 1024} KB | strip {strip} | "
          f"dense {[p.name for p in sheets]}", flush=True)
    return chk


def run(seg, eng, key, suffix="", enhance=True):
    outdir(seg).mkdir(parents=True, exist_ok=True)
    first, last = FRAMES[seg]
    name = f"seg{seg}-{eng}-aligned{suffix}"
    dest = outdir(seg) / f"{name}.mp4"
    if dest.exists():
        raise SystemExit(f"{dest} exists, pick another suffix")
    prompt = PROMPTS[key]
    ins = f"{first.name} + last {last.name} (aligned keyframes)"
    model = VIDEO_MODEL if eng == "veo" else OMNI_MODEL
    for attempt in range(1, VEO_ATTEMPTS + 1):
        t0 = time.time()
        try:
            model, used, extra = veo(first, last, prompt, dest, enhance) if eng == "veo" else omni(first, last, prompt, dest)
            break
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            log_call(model, ins, f"[4k 8s, prompt {key}] {name} attempt {attempt}", "-", f"failure: {msg[:220]}")
            print("FAILED", name, msg[:400], flush=True)
            # a Veo operation can be accepted and then fail with "high load" (code 8): resubmit after a pause, each attempt logged
            if eng == "veo" and attempt < VEO_ATTEMPTS and any(t in msg for t in TRANSIENT + VEO_TRANSIENT):
                print(f"  transient Veo failure, resubmitting in {VEO_PAUSE * attempt}s", flush=True)
                time.sleep(VEO_PAUSE * attempt)
                continue
            return None
    (outdir(seg) / f"{name}.prompt.txt").write_text(f"model={model} 4k 16:9 8s no audio first={first.name} last={last.name} key={key}\n{extra}\n\n{used}\n")
    to_gcs(dest, f"review/hero/{dest.parent.name if dest.parent == NEW else ''}{'/' if dest.parent == NEW else ''}{name}.mp4")
    log_call(model, ins, f"[4k 8s, prompt {key}, hero lead A] {used}", f"_source/generated/video/hero/{'new/' if dest.parent == NEW else ''}{name}.mp4",
             f"success in {time.time() - t0:.0f}s (frame check pending)")
    print("saved", dest, dest.stat().st_size // 1_000_000, "MB", flush=True)
    return review(name, dest, seg)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "run":
        run(int(a[1]), a[2], a[3], a[4] if len(a) > 4 and not a[4].startswith("--") else "", enhance="--no-enhance" not in a)
    elif a and a[0] == "review":
        review(a[1], outdir(a[2]) / f"{a[1]}.mp4", int(a[2]))
    elif a and a[0] == "ends":
        print(a[1], json.dumps(ends(outdir(a[2]) / f"{a[1]}.mp4", int(a[2]))))
    elif a and a[0] == "sheet":
        sheet(*(pathlib.Path(x) for x in a[1:3]))
    elif a and a[0] == "window":  # window <name> <t0> <t1> <step>: a closer look at one stretch
        print([str(p) for p in dense(a[1], (NEW if a[1].startswith("seg1") and a[1][3:5].isdigit() else OUT) / f"{a[1]}.mp4", step=float(a[4]), t0=float(a[2]), t1=float(a[3]), tag=f"win{a[2]}-")])
    elif a and a[0] == "compare":
        for tt in (a[3:] or [None]):
            compare(a[1], int(a[2]), None if tt is None else float(tt))
    else:
        raise SystemExit(__doc__)
