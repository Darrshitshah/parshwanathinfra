"""Hero seg3 / seg4 from the camera-consistent (aligned) keyframes on Veo 3.1 and Omni 1.1 Flash (owner: hero lead A).

    GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow \
      --with google-cloud-storage --with imageio-ffmpeg --with opencv-python-headless --with numpy python tools/imagegen/hero_video_aligned.py \
      run <3|4> <veo|omni> <prompt-key> [suffix] [--no-enhance]      one take (4K, 8 s, first + last frame, no audio)
      review <name> <3|4>                                             re-run the frame check on an existing take

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
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-a")
BUCKET = "parshwanath-infra-veo"
REVIEW = f"gs://{BUCKET}/review/hero/"
OMNI_MODEL = "gemini-omni-1.1-flash-preview"
W, H = 3840, 2160
FRAMES = {3: (FR / "stage-3.jpg", AL / "stage-4-aligned.jpg"), 4: (AL / "stage-4-aligned.jpg", AL / "stage-5-aligned.jpg")}

LOCK = ("Static locked-off camera on a tripod: a construction time-lapse in one continuous shot with no cuts. The camera does not move at all, "
        "no zoom, no pan, no tilt, no push-in, no change of angle. ")
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
}
NEG = ("camera movement, zoom, push-in, dolly, pan, tilt, orbit, fly-through, cut, scene change, close-up, towers, skyscrapers, extra floors, "
       "new buildings, buildings outside the site, morphing, melting, text, letters, logos, watermark, flicker, people close to camera")
OMNI_HEAD = "The first image is the first frame and the second image is the last frame. "
OMNI_TAIL = " No audio. Avoid: camera movement, zoom, cuts, close-ups, new buildings, towers, extra floors, text, logos, flicker."
TRANSIENT = ("429", "RESOURCE_EXHAUSTED", "500", "INTERNAL", "503", "UNAVAILABLE", "Internal error")


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
    try:
        op = retry(lambda: c.models.generate_videos(model=VIDEO_MODEL, prompt=prompt, image=img, config=cfg(enhance)))
    except Exception as e:  # noqa: BLE001
        if enhance or "enhance" not in str(e).lower():
            raise
        print("  enhance_prompt=False refused, using True:", str(e)[:120], flush=True)
        enhance = True
        op = retry(lambda: c.models.generate_videos(model=VIDEO_MODEL, prompt=prompt, image=img, config=cfg(True)))
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
    mp4 = preview(name, src)
    chk = lock_check(src, seg)
    chk.update(name=name, duration=duration(src), preview=str(mp4), strip=str(strip))
    (SCR / "frames" / f"{name}-check.json").write_text(json.dumps(chk, indent=1))
    print(f"{name}: {chk['duration']:.2f}s | camera shift max {chk['max_shift_px']} px @3840 | lost {chk['lost_at']} | env MAD max "
          f"{chk['max_env_mad']} | preview {mp4.stat().st_size // 1024} KB | strip {strip}", flush=True)
    return chk


def run(seg, eng, key, suffix="", enhance=True):
    OUT.mkdir(parents=True, exist_ok=True)
    first, last = FRAMES[seg]
    name = f"seg{seg}-{eng}-aligned{suffix}"
    dest = OUT / f"{name}.mp4"
    if dest.exists():
        raise SystemExit(f"{dest} exists, pick another suffix")
    prompt = PROMPTS[key]
    ins = f"{first.name} + last {last.name} (aligned keyframes)"
    model = VIDEO_MODEL if eng == "veo" else OMNI_MODEL
    t0 = time.time()
    try:
        model, used, extra = veo(first, last, prompt, dest, enhance) if eng == "veo" else omni(first, last, prompt, dest)
    except Exception as e:  # noqa: BLE001
        log_call(model, ins, f"[4k 8s, prompt {key}] seg{seg} {eng}", "-", f"failure: {str(e)[:220]}")
        print("FAILED", name, str(e)[:400], flush=True)
        return None
    (OUT / f"{name}.prompt.txt").write_text(f"model={model} 4k 16:9 8s no audio first={first.name} last={last.name} key={key}\n{extra}\n\n{used}\n")
    to_gcs(dest, f"review/hero/{name}.mp4")
    log_call(model, ins, f"[4k 8s, prompt {key}, hero lead A] {used}", f"_source/generated/video/hero/{name}.mp4",
             f"success in {time.time() - t0:.0f}s (frame check pending)")
    print("saved", dest, dest.stat().st_size // 1_000_000, "MB", flush=True)
    return review(name, dest, seg)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "run":
        run(int(a[1]), a[2], a[3], a[4] if len(a) > 4 and not a[4].startswith("--") else "", enhance="--no-enhance" not in a)
    elif a and a[0] == "review":
        review(a[1], OUT / f"{a[1]}.mp4", int(a[2]))
    else:
        raise SystemExit(__doc__)
