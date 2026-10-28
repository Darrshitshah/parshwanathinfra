"""Hero segment 5 (stage-5 original -> SS-01): takes on Omni 1.1 Flash and Veo 3.1, plus a Nano Banana 2.1 midpoint keyframe.
Run from the project folder (quote the path, it ends with a space):
  python tools/imagegen/hero_seg5.py take <omni|veo> <name> <prompt-key> [first=stage-5] [last=ss01] [seconds=8]
  python tools/imagegen/hero_seg5.py mid <name> <prompt-key>        (Nano Banana strict edit, 4K, IMAGE 1 stage-5, IMAGE 2 SS-01)
  python tools/imagegen/hero_seg5.py review <name>                  (preview + 6-still strip for an existing clip)
  python tools/imagegen/hero_seg5.py strip <name> <out-name> [n=12] [cols=3] [width=560] [t0] [t1]   (dense strip of a time window)
Frames are looked up as _source/generated/hero-keyframes/frames-4k/<x>.jpg, or pass a path.
Originals -> _source/generated/video/hero/<name>.mp4 (+ .prompt.txt); copy -> gs://parshwanath-infra-veo/review/hero/<name>.mp4;
preview (720 px, under 2 MB) and stills -> scratchpad hero-b. Every call is logged in docs/IMAGEGEN_LOG.md.
"""
import pathlib
import subprocess
import sys
import time
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import imageio_ffmpeg
from google.genai import types
from PIL import Image
from _lib import GEN, IMAGE_MODEL, PROJECT, VIDEO_MODEL, backoff, client, gen_image, log_call

Image.MAX_IMAGE_PIXELS = None
FF = imageio_ffmpeg.get_ffmpeg_exe()
FR = GEN / "hero-keyframes" / "frames-4k"
OUT = GEN / "video" / "hero"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-b")
BUCKET = "parshwanath-infra-veo"
REVIEW = f"gs://{BUCKET}/review/hero/"
OMNI_MODEL = "gemini-omni-1.1-flash-preview"

NEG = ("cross-dissolve, double exposure, ghosted or transparent buildings, buildings fading in or out, morphing, melting, warping, "
       "extra floors, fewer floors, cranes, scaffolding, construction equipment, text, letters, logos, watermark, birds, aircraft, "
       "flicker, camera shake, cartoon look")
OMNI_TAIL = (" No audio. Avoid: cross-dissolve, double exposure, ghosted or transparent buildings, buildings fading in or out, morphing or melting "
             "buildings, extra or fewer floors, text, logos, flicker, camera shake.")

DESIGN = ("Every building keeps one design throughout: an open stilt-parking ground storey, five floors of windows with white box frames and "
          "charcoal railings, and a roof terrace with a low parapet. No building changes its floors or shape, no building ghosts, fades or melts "
          "into another, and every building is solid and opaque in every frame. Warm golden morning light. No text.")

PROMPTS = {
    # A: one rising, pulling-back move; the extra blocks are revealed by the wider view; the landscape matures like a time-lapse.
    "A": ("One slow, continuous, cinematic drone shot at golden hour. The camera starts at the first frame's oblique view of the finished township "
          "and rises steadily while pulling back and turning gently, never descending and never closer than the first frame, until it settles on the "
          "high wide view of the last frame. As it rises the view opens up and the rest of the township comes into sight: further rows of the same khaki "
          "and olive apartment blocks stand beyond and between the first ones, extending across the site exactly as the last frame shows. Over the "
          "eight seconds the landscape matures like a time-lapse: young trees grow into dense green canopy along the roads and around the buildings, "
          "lawns turn lush, shrubs and palms fill the courtyards, and the farmland around the site gives way to tree cover. " + DESIGN),
    # B: same, but the new blocks complete themselves in a quick time-lapse (the film's own grammar) instead of being revealed.
    "B": ("One slow, continuous, cinematic drone shot at golden hour: the camera rises steadily and pulls back from the first frame's oblique view to the "
          "high wide view of the last frame, never descending, never closer than the first frame. The time-lapse of the township's growth carries on: "
          "in the first half the camera only rises and the finished blocks stay exactly as they are while the trees around them grow taller and fuller; "
          "in the second half, as the view widens, the remaining blocks of the township rise out of the greenery in the gaps between and beyond the first "
          "ones, quickly completing themselves into the same khaki and olive design, until the layout is exactly the last frame's. The surrounding "
          "farmland fills with tree canopy and the lawns turn lush. " + DESIGN),
    # C: shorter, plain, no story: just the camera and the greenery (control).
    "C": ("A very slow, smooth drone move: the camera rises and pulls back from the first frame's view to the last frame's view, never descending. "
          "The greenery grows thicker and more lush as it goes, and the township fills out into the arrangement of the last frame. " + DESIGN),
}


# Midpoint route: SA = stage-5 to seg5-mid1 (camera move over ONE layout), SB1 / SB2 = seg5-mid1 to ss01 (same camera, the layout fills in).
PROMPTS.update({
    "SA": ("One slow, smooth, continuous drone shot at golden hour. The camera rises steadily and pulls back, turning slightly, from the first frame's "
           "oblique view of the finished township to the higher, wider view of the last frame; it never descends, never swoops and never gets closer than "
           "the first frame. The same buildings stand in the same places in every frame, solid and opaque, each with an open stilt-parking ground storey, "
           "five floors of windows with white box frames and charcoal railings, and a roof terrace; no building appears, vanishes, ghosts or changes shape. "
           "As the camera rises the trees along the roads and around the buildings grow fuller and the farmland beyond the site turns greener, as in the "
           "last frame. Warm golden morning light. No text."),
    "SB1": ("A nearly locked drone shot at golden hour: the camera starts at the first frame's high wide view and only rises very slightly and settles "
            "into the last frame, with no other camera movement. The township grows into its final form in place: the open spaces between and beyond the "
            "existing blocks fill with further blocks of the same khaki and olive design (open stilt-parking ground storey, five floors of windows with "
            "white box frames, roof terrace), exactly in the arrangement of the last frame, while the trees grow into dense canopy and the lawns turn lush. "
            "The highway, the horizon and the fields stay fixed. Every building is solid and opaque in every frame, no ghosting, no double exposure, no "
            "melting; the change happens quickly and cleanly in the first half and the second half is calm. Warm golden morning light. No text."),
    "SB2": ("A nearly locked drone shot at golden hour: the camera starts at the first frame's high wide view and only rises very slightly and settles "
            "into the last frame. Early in the shot the low sun breaks over the horizon and a soft golden haze and glare washes briefly across the whole "
            "scene; as it clears, the township stands in its final form exactly as in the last frame, with more blocks of the same khaki and olive design "
            "(open stilt-parking ground storey, five floors of windows with white box frames, roof terrace), dense tree canopy and lush lawns. The "
            "highway, the horizon and the fields stay fixed. Every building is solid and opaque once it is visible. Calm second half. No text."),
})


def frame_path(x):
    p = pathlib.Path(x)
    if p.exists():
        return p
    return FR / f"{x}.jpg"


def to_gcs(path, key):
    from google.cloud import storage
    storage.Client(project=PROJECT).bucket(BUCKET).blob(key).upload_from_filename(str(path))


def from_gcs(uri, dest):
    from google.cloud import storage
    bkt, _, key = uri[5:].partition("/")
    storage.Client(project=PROJECT).bucket(bkt).blob(key).download_to_filename(str(dest))


def veo(first, last, prompt, secs, dest):
    cfg = types.GenerateVideosConfig(aspect_ratio="16:9", resolution="4k", duration_seconds=secs, number_of_videos=1, generate_audio=False,
                                     enhance_prompt=True, compression_quality="OPTIMIZED", negative_prompt=NEG, person_generation="allow_adult",
                                     last_frame=types.Image(image_bytes=last.read_bytes(), mime_type="image/jpeg"))
    c = client("us-central1")
    op = backoff(lambda: c.models.generate_videos(model=VIDEO_MODEL, prompt=prompt,
                 image=types.Image(image_bytes=first.read_bytes(), mime_type="image/jpeg"), config=cfg))
    while not op.done:
        time.sleep(15)
        op = c.operations.get(op)
    if op.error or not op.response or not op.response.generated_videos:
        raise RuntimeError(f"veo: {op.error or getattr(op.response, 'rai_media_filtered_reasons', 'no video')}")
    dest.write_bytes(op.response.generated_videos[0].video.video_bytes)
    return VIDEO_MODEL


def omni(first, last, prompt, secs, dest):
    import omni as O
    full = "The first image is the first frame and the second image is the last frame. " + prompt + OMNI_TAIL
    rf = [{"type": "video", "delivery": "uri", "gcs_uri": REVIEW + "omni-raw/", "aspect_ratio": "16:9", "resolution": "4k", "duration": f"{secs}s"}]
    content = [{"type": "text", "text": full}, {"type": "image", "data": O.b64(first), "mime_type": "image/jpeg"},
               {"type": "image", "data": O.b64(last), "mime_type": "image/jpeg"}]
    last_err = None
    for attempt in range(2):  # one retry on a transient 5xx/429 (seg3 omni once returned HTTP 500)
        try:
            j, _ = O.ia(content, response_format=rf, gen_cfg={"video_config": {"task": "image_to_video"}}, timeout=900)
            break
        except RuntimeError as e:
            last_err = e
            if attempt == 0 and any(c in str(e) for c in ("HTTP 500", "HTTP 503", "HTTP 429")):
                print("  transient error, retry in 60 s:", str(e)[:120])
                time.sleep(60)
                continue
            raise
    else:
        raise last_err
    uri = None
    for st in j.get("steps", []):
        for c in (st.get("content", []) if st.get("type") == "model_output" else []):
            if c.get("type") == "video" and c.get("uri"):
                uri = c["uri"]
    if not uri:
        raise RuntimeError(f"omni: no video uri, status={j.get('status')}")
    tmp = dest.with_name(dest.stem + "-audio.mp4")
    from_gcs(uri, tmp)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(tmp), "-an", "-c:v", "copy", str(dest)], check=True)
    tmp.unlink()
    return OMNI_MODEL, full


def duration(src):
    import re
    r = subprocess.run([FF, "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def strip_image(src, out, n=6, cols=2, w=800, t0=None, t1=None):
    """Contact strip of n stills from t0 to t1 (default the whole clip), each tile labelled with its time."""
    from PIL import ImageDraw
    dur = duration(src)
    t0 = 0.05 if t0 is None else t0
    t1 = dur - 0.08 if t1 is None else t1
    ts = [t0 + (t1 - t0) * i / (n - 1) for i in range(n)]
    tiles = []
    for i, t in enumerate(ts):
        f = SCR / "frames" / f"_tile{i}.jpg"
        subprocess.run([FF, "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(src), "-frames:v", "1", "-vf", f"scale={w}:-2", "-q:v", "3", str(f)], check=True)
        im = Image.open(f).convert("RGB")
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 78, 20], fill=(0, 0, 0)); d.text((4, 4), f"t={t:.2f}s", fill=(255, 255, 0))
        tiles.append(im)
    tw, th = tiles[0].size
    rows = (n + cols - 1) // cols
    sh = Image.new("RGB", (tw * cols, th * rows), (20, 20, 20))
    for i, im in enumerate(tiles):
        sh.paste(im, ((i % cols) * tw, (i // cols) * th))
    sh.save(out, quality=86)
    return out


def review(name, src, n=6, cols=2, w=800):
    """Preview (720 px H.264 under 2 MB) and an n-still strip, both in scratchpad hero-b."""
    (SCR / "takes").mkdir(parents=True, exist_ok=True); (SCR / "frames").mkdir(parents=True, exist_ok=True)
    strip = strip_image(src, SCR / "frames" / f"{name}-strip.jpg", n, cols, w)
    mp4 = SCR / "takes" / f"{name}.mp4"
    for crf in (24, 26, 28, 30, 32, 34):
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(src), "-an", "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], check=True)
        if mp4.stat().st_size < 2_000_000:
            break
    print(name, f"preview {mp4.stat().st_size // 1024} KB, {duration(src):.2f}s ->", mp4, "| strip ->", strip)


def take(eng, name, key, first_name="stage-5", last_name="ss01", secs=8):
    OUT.mkdir(parents=True, exist_ok=True)
    first, last = frame_path(first_name), frame_path(last_name)
    dest = OUT / f"{name}.mp4"
    ins = f"{first.name} + last {last.name}"
    prompt = PROMPTS[key] if key in PROMPTS else key
    try:
        model, used = ((veo(first, last, prompt, secs, dest), prompt) if eng == "veo" else omni(first, last, prompt, secs, dest))
        (OUT / f"{name}.prompt.txt").write_text(used + "\n")
        to_gcs(dest, f"review/hero/{name}.mp4")
        log_call(model, ins, f"[4k {secs}s] {used}", f"_source/generated/video/hero/{name}.mp4", "success (frame check pending)")
        review(name, dest)
    except Exception as e:  # noqa: BLE001
        log_call(VIDEO_MODEL if eng == "veo" else OMNI_MODEL, ins, f"[4k {secs}s] {name} ({key})", "-", f"failure: {str(e)[:200]}")
        print("FAILED", name, str(e)[:400])


MID = {
    # M1: the township of IMAGE 1 re-photographed from (almost) IMAGE 2's higher, wider viewpoint.
    "M1": ("IMAGE 1 is a drone photograph of a finished township (the CONTENT to keep). IMAGE 2 is a render of the same site from a higher, wider "
           "drone viewpoint (a CAMERA and atmosphere reference only). TASK: photograph the township of IMAGE 1 again from a drone position almost at "
           "the viewpoint of IMAGE 2: higher and further back than IMAGE 1, looking down at the same angle and with the horizon at the same height "
           "as in IMAGE 2, so the township sits in the frame where IMAGE 2's township sits and more of the surroundings show. KEEP from IMAGE 1 exactly: "
           "its buildings in the same arrangement relative to each other, each with its design (warm khaki sand-olive walls, open stilt-parking ground "
           "storey, five floors of windows with white box frames and charcoal railings, roof terrace with a low parapet and small stair headrooms), the "
           "red-brick row houses at the left, the roundabout, the grey paver forecourt and the highway at the right. Do NOT copy the buildings or layout "
           "of IMAGE 2 and do not add or remove any building: the layout stays that of IMAGE 1. Take from IMAGE 2 only the viewpoint and a lusher, "
           "denser tree canopy around the site. Warm golden-hour light, natural drone photograph colours, no CGI look. No text, letters, logos or "
           "watermarks. Do not crop or letterbox."),
}


def mid(name, key):
    p = MID[key] if key in MID else key
    dest = gen_image(f"hero-keyframes/{name}", p, inputs=[FR / "stage-5.jpg", FR / "ss01.jpg"], aspect="16:9", size="4K",
                     summary=f"seg5 midpoint keyframe {key}: stage-5 content re-photographed toward the SS-01 viewpoint (strict edit)")
    if dest:
        Image.open(dest).convert("RGB").resize((3840, 2160), Image.LANCZOS).save(FR / f"{name}.jpg", quality=95)
        Image.open(FR / f"{name}.jpg").resize((1600, 900), Image.LANCZOS).save(SCR / "kf" / f"{name}-1600.jpg", quality=88)
        print("midpoint ->", FR / f"{name}.jpg", "| preview ->", SCR / "kf" / f"{name}-1600.jpg")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "take":
        a = sys.argv[2:]
        take(a[0], a[1], a[2], a[3] if len(a) > 3 else "stage-5", a[4] if len(a) > 4 else "ss01", int(a[5]) if len(a) > 5 else 8)
    elif cmd == "mid":
        mid(sys.argv[2], sys.argv[3])
    elif cmd == "review":
        review(sys.argv[2], OUT / f"{sys.argv[2]}.mp4")
    elif cmd == "strip":  # strip <name> <out-name> [n=12] [cols=3] [width=560] [t0] [t1]
        a = sys.argv[2:]
        (SCR / "frames").mkdir(parents=True, exist_ok=True)
        print(strip_image(OUT / f"{a[0]}.mp4", SCR / "frames" / f"{a[1]}.jpg", int(a[2]) if len(a) > 2 else 12, int(a[3]) if len(a) > 3 else 3,
                          int(a[4]) if len(a) > 4 else 560, float(a[5]) if len(a) > 5 else None, float(a[6]) if len(a) > 6 else None))
    else:
        raise SystemExit(__doc__)
