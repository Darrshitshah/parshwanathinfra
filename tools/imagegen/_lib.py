"""Shared helpers: Vertex client, retry with backoff, prompt/output saving, call log.

Run any script with:
  GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 \
    --with google-genai --with pillow --with imageio-ffmpeg python tools/imagegen/<script>.py
"""
import datetime
import os
import pathlib
import random
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
GEN = ROOT / "_source" / "generated"
LOG = ROOT / "docs" / "IMAGEGEN_LOG.md"
KIT = pathlib.Path.home() / "SHIV SHIVA TOWNSHIP/SHIVA SHIVA IMG/Photoreal Kit"
V2 = KIT / "Photoreal Output" / "Hiranandani Style v2"
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "my-jev-autonomous-agent")
IMAGE_MODEL = "gemini-nano-banana-2.1"
VIDEO_MODEL = "veo-3.1-generate-001"
LOG_HEADER = (
    "# Image and video generation log\n\n"
    "Every call to Nano Banana 2.1 (`gemini-nano-banana-2.1`, location `global`) and Veo 3.1 "
    "(`veo-3.1-generate-001`, `us-central1`) for this site, newest last. Originals and prompts live in "
    "`_source/generated/` (gitignored). Times are local.\n\n"
    "| Time | Model | Inputs | Prompt summary | Output | Result |\n|---|---|---|---|---|---|\n"
)

STRICT = (
    "STRICT EDIT, NOT A REDESIGN. Edit IMAGE 1. The result must line up with IMAGE 1 when laid over it: same camera, "
    "same horizon line, same building outlines, same edges of roads, lawns and planters. Count the floors and the window "
    "bays of every building in IMAGE 1 and keep exactly those numbers. Keep every building, including small or distant "
    "ones. Everything paved stays paved. Treat every facade as a fixed construction drawing: each unit's elevation, its "
    "frames, brick pillars, balconies, windows, porches, proportions and materials are copied exactly. Add nothing that "
    "IMAGE 1 does not show."
)
DO_NOT = (
    "DO NOT redesign, add or remove floors, buildings, windows, balconies or structures. Do not crop, reframe, stretch or "
    "change the camera. Do not add text, letters, numbers, logos, watermarks or borders. No brand names. Cars stay exactly "
    "where they are, Indian-market models with unreadable plates. No neon grass, cloned trees, repeated people, warped "
    "verticals or plastic CGI look."
)


_CLIENTS = {}


def client(location="global"):
    from google import genai
    if location not in _CLIENTS:  # keep a reference: a garbage-collected client closes its HTTP session
        _CLIENTS[location] = genai.Client(vertexai=True, project=PROJECT, location=location)
    return _CLIENTS[location]


def log_call(model, inputs, summary, output, result):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if not LOG.exists():
        LOG.write_text(LOG_HEADER)
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    row = "| {} | {} | {} | {} | {} | {} |\n".format(
        ts, model, inputs.replace("|", "/"), summary.replace("|", "/").replace("\n", " ")[:300], output, result.replace("|", "/").replace("\n", " ")[:300])
    with LOG.open("a") as f:
        f.write(row)


def backoff(fn, tries=6):
    delay = 8.0
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001
            msg = str(e)
            if ("429" in msg or "RESOURCE_EXHAUSTED" in msg or "503" in msg) and i < tries - 1:
                wait = delay + random.uniform(0, 3)
                print(f"  rate limited, retry in {wait:.0f}s")
                time.sleep(wait)
                delay *= 2
                continue
            raise


def ratio_str(w, h):
    ratios = {"1:1": 1, "3:2": 1.5, "4:3": 4 / 3, "16:9": 16 / 9, "21:9": 21 / 9, "9:16": 9 / 16, "3:4": 0.75}
    return min(ratios, key=lambda k: abs(ratios[k] - w / h))


def gen_image(name, prompt, inputs=(), aspect="16:9", size="4K", summary=None):
    """One Nano Banana call. inputs: list of image Paths (attached in order as IMAGE 1, 2 ...)."""
    import mimetypes
    from google.genai import types
    GEN.mkdir(parents=True, exist_ok=True)
    dest = GEN / f"{name}.png"
    contents = []
    for i, p in enumerate(inputs, 1):
        contents += [f"IMAGE {i}:", types.Part.from_bytes(data=pathlib.Path(p).read_bytes(),
                                                         mime_type=mimetypes.guess_type(str(p))[0] or "image/png")]
    contents.append(prompt)
    (GEN / f"{name}.prompt.txt").write_text(prompt)
    ins = ", ".join(pathlib.Path(p).name for p in inputs) or "none (text only)"
    try:
        resp = backoff(lambda: client("global").models.generate_content(
            model=IMAGE_MODEL, contents=contents,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"],
                                               image_config=types.ImageConfig(image_size=size, aspect_ratio=aspect))))
        for p in resp.candidates[0].content.parts:
            if p.inline_data:
                dest.write_bytes(p.inline_data.data)
                log_call(IMAGE_MODEL, ins, summary or prompt[:200], f"_source/generated/{name}.png", "success")
                print("saved", dest)
                return dest
        reason = str(resp.candidates[0].finish_reason)
        log_call(IMAGE_MODEL, ins, summary or prompt[:200], "-", f"failure: no image ({reason})")
    except Exception as e:  # noqa: BLE001
        log_call(IMAGE_MODEL, ins, summary or prompt[:200], "-", f"failure: {str(e)[:200]}")
        raise
    return None


def preview(path, out, width=1280):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(path).convert("RGB")
    im.thumbnail((width, width))
    im.save(out, quality=82)
    return out
