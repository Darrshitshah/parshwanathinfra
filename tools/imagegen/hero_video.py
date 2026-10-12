"""Hero 'township builds itself' segments with Veo 3.1 and Omni 1.1 Flash (first + last frame, 4K, 8 s, no audio).
Usage: python tools/imagegen/hero_video.py prep | <seg 1-5> <veo|omni> [suffix]
Frames: segN first = hero-keyframes/stage-N, last = stage-(N+1) (seg 5: last = SS-01 v2 cropped to 16:9).
Originals -> _source/generated/video/hero/, review copy -> gs://parshwanath-infra-veo/review/hero/, phone preview + stills -> scratchpad.
"""
import base64
import pathlib
import subprocess
import sys
import time
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import imageio_ffmpeg
from google.genai import types
from PIL import Image
from _lib import GEN, PROJECT, V2, VIDEO_MODEL, backoff, client, log_call

Image.MAX_IMAGE_PIXELS = None
FF = imageio_ffmpeg.get_ffmpeg_exe()
KF = GEN / "hero-keyframes"
FR = KF / "frames-4k"
OUT = GEN / "video" / "hero"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/scene-lead/videos/hero")
BUCKET = "parshwanath-infra-veo"
REVIEW = f"gs://{BUCKET}/review/hero/"
NEG = ("buildings morphing, melting or changing shape, extra floors, fewer floors, new buildings, text, letters, logos, watermark, "
       "birds, aircraft, flicker, camera shake, cartoon look, people close to camera")
STAY = ("Locked drone camera with only a very slow, smooth drift. The site layout, road lines, footprints and camera angle stay exactly "
        "as in the first and last frames. Warm golden morning light throughout. No text. ")
SS01 = V2 / "SS-01 Masterplan Aerial - hiranandani.png"

SEG = {
    1: STAY + "Over eight seconds fresh black asphalt unrolls along the orange survey lines, the road network draws itself in, white edge "
       "markings and granite kerbs appear, and the roundabout island rises at the junction. Dust drifts, a few trucks move slowly on the highway. "
       "Everything else stays bare graded earth.",
    2: STAY + "Over eight seconds concrete plinths rise from the bare earth on every building footprint, excavators and a concrete mixer "
       "truck move between them, small workers in safety vests walk, brick, steel and sand stacks appear beside the plinths. The roads stay as they are.",
    3: STAY + "Over eight seconds reinforced-concrete frames climb floor by floor from the plinths, columns first then slabs, scaffolding and "
       "green netting wrap the upper levels, tower cranes swing slowly, brick infill creeps up the lower floors and the row houses rise in red brick. Never taller than the last frame.",
    4: STAY + "Over eight seconds the scaffolding and netting come away, brick infill and plaster close the frames, walls take warm khaki "
       "sand-olive paint with white box-frames around the window stacks and charcoal railings, the cranes lift away, equipment drives out, "
       "pavers and kerbs finish, and lawns, palms and flowering trees grow in. Each block ends as an open stilt-parking ground storey plus five floors of windows plus a roof terrace.",
    5: STAY.replace("Locked drone camera with only a very slow, smooth drift.", "A smooth drone move: the camera slowly lifts and drifts right and forward into the framing of the last frame.")
       + "Over eight seconds the finished township settles into the last frame: the greenery thickens around the buildings, lawns and trees fill the "
       "open spaces, and the light softens, ending exactly on the last frame. Each block keeps its stilt-parking ground storey plus five floors plus roof terrace.",
}


RETRY = {
    3: ("LOCKED camera, no zoom, no descent, no swoop: the framing is identical in every frame, only the buildings change. Over eight seconds "
        "ALL building blocks rise together from their plinths, floor by floor, at the same pace, each ending exactly as the last frame shows "
        "(three to five open concrete floors, row houses two storeys). No block ever rises above the heights in the last frame; there are no "
        "isolated tall towers. Scaffolding and a crane appear as in the last frame. Roads stay as they are. Warm golden morning light. No text."),
    4: ("LOCKED camera, no zoom, no descent, no swoop: the framing is identical in every frame, only the buildings change. Over eight seconds "
        "the same building blocks in the same positions finish: scaffolding and netting come away, walls take warm khaki sand-olive paint with white "
        "box-frames and charcoal railings, the crane lifts away, equipment leaves, pavers and kerbs finish and greenery grows in. Each block ends as an "
        "open stilt-parking ground storey plus five floors plus a roof terrace, as in the last frame. No new buildings, no isolated blocks, no layout change. "
        "Warm golden morning light. No text."),
    5: ("A very slow, smooth drone move: the camera lifts and drifts a little to the right and forward, never closer than the first frame, into the "
        "framing of the last frame. The same township layout throughout, every block keeping its open stilt-parking ground storey plus five floors plus "
        "roof terrace. Over eight seconds the greenery thickens and the view settles into the last frame. No new or removed buildings. Warm golden light. No text."),
}


def prep():
    FR.mkdir(parents=True, exist_ok=True)
    for i in range(1, 6):
        Image.open(KF / f"stage-{i}.png").convert("RGB").resize((3840, 2160), Image.LANCZOS).save(FR / f"stage-{i}.jpg", quality=95)
    im = Image.open(SS01).convert("RGB")
    h = round(im.width * 9 / 16)
    y0 = min(180, im.height - h)
    im.crop((0, y0, im.width, y0 + h)).resize((3840, 2160), Image.LANCZOS).save(FR / "ss01.jpg", quality=95)
    print("prepared", sorted(p.name for p in FR.glob("*.jpg")))


def frames(seg):
    return FR / f"stage-{seg}.jpg", FR / (f"stage-{seg + 1}.jpg" if seg < 5 else "ss01.jpg")


def to_gcs(path, key):
    from google.cloud import storage
    storage.Client(project=PROJECT).bucket(BUCKET).blob(key).upload_from_filename(str(path))


def from_gcs(uri, dest):
    from google.cloud import storage
    bkt, _, key = uri[5:].partition("/")
    storage.Client(project=PROJECT).bucket(bkt).blob(key).download_to_filename(str(dest))


def veo(seg, name, dest):
    first, last = frames(seg)
    prompt = RETRY[seg] if (seg in RETRY and "r2" in name) else SEG[seg]
    cfg = types.GenerateVideosConfig(aspect_ratio="16:9", resolution="4k", duration_seconds=8, number_of_videos=1, generate_audio=False,
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
    v = op.response.generated_videos[0].video
    dest.write_bytes(v.video_bytes)
    return VIDEO_MODEL, prompt


def omni(seg, name, dest):
    import omni as O
    first, last = frames(seg)
    prompt = ("The first image is the first frame and the second image is the last frame. " + (RETRY[seg] if (seg in RETRY and "r2" in name) else SEG[seg]) +
              " No audio. Avoid: buildings morphing, extra or fewer floors, new buildings, text, logos, flicker, camera shake.")
    rf = [{"type": "video", "delivery": "uri", "gcs_uri": REVIEW, "aspect_ratio": "16:9", "resolution": "4k", "duration": "8s"}]
    j, dt = O.ia([{"type": "text", "text": prompt}, {"type": "image", "data": O.b64(first), "mime_type": "image/jpeg"},
                  {"type": "image", "data": O.b64(last), "mime_type": "image/jpeg"}],
                 response_format=rf, gen_cfg={"video_config": {"task": "image_to_video"}}, timeout=900)
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
    return O.MODEL, prompt


def review(name, src):
    SCR.mkdir(parents=True, exist_ok=True); (SCR / "frames").mkdir(exist_ok=True)
    fr = []
    for i, t in enumerate([0.1, 2.7, 5.3, 7.85]):
        f = SCR / "frames" / f"{name}-{i}.jpg"
        subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(t), "-i", str(src), "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "3", str(f)], check=True)
        fr.append(Image.open(f))
    w, h = fr[0].size
    sh = Image.new("RGB", (w * 2, h * 2))
    for i, x in enumerate(fr):
        sh.paste(x, ((i % 2) * w, (i // 2) * h))
    sh.save(SCR / "frames" / f"{name}-strip.jpg", quality=85)
    mp4 = SCR / f"{name}.mp4"
    for crf in (24, 26, 28, 30, 32, 34):
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(src), "-an", "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], check=True)
        if mp4.stat().st_size < 2_000_000:
            break
    print(name, "preview", mp4.stat().st_size // 1024, "KB")


def run(seg, eng, suffix=""):
    OUT.mkdir(parents=True, exist_ok=True)
    name = f"seg{seg}-{eng}{suffix}"
    dest = OUT / f"{name}.mp4"
    first, last = frames(seg)
    ins = f"{first.name} + last {last.name}"
    try:
        model, prompt = (veo if eng == "veo" else omni)(seg, name, dest)
        (OUT / f"{name}.prompt.txt").write_text(prompt + "\n")
        to_gcs(dest, f"review/hero/{name}.mp4")
        log_call(model, ins, f"[4k 8s] {prompt}", f"_source/generated/video/hero/{name}.mp4", "success (frame check pending)")
        review(name, dest)
    except Exception as e:  # noqa: BLE001
        log_call(VIDEO_MODEL if eng == "veo" else "gemini-omni-1.1-flash-preview", ins, f"[4k 8s] seg{seg}", "-", f"failure: {str(e)[:200]}")
        print("FAILED", name, str(e)[:300])


if __name__ == "__main__":
    if sys.argv[1] == "prep":
        prep()
    else:
        run(int(sys.argv[1]), sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
