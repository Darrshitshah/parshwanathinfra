"""Gemini Omni 1.1 Flash probes and helpers (PART 1 study). Usage: python tools/imagegen/omni.py <probe>
Omni is called two ways: generateContent (text/vision understanding) and the Interactions API (video generation/editing, REST
v1beta1, location global). Logged to docs/IMAGEGEN_LOG.md. Never prints base64."""
import base64
import json
import pathlib
import sys
import time
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import google.auth
import google.auth.transport.requests as gtr
from google.genai import types
from _lib import GEN, PROJECT, backoff, client, log_call

MODEL = "gemini-omni-1.1-flash-preview"
KF = GEN / "keyframes"
SCRATCH = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/scene-lead")
OUT = SCRATCH / "omni"
VID = SCRATCH / "videos"
URL = f"https://aiplatform.googleapis.com/v1beta1/projects/{PROJECT}/locations/global/interactions"


def session():
    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    return gtr.AuthorizedSession(creds)


def gc(contents, **cfg):
    t = time.time()
    r = backoff(lambda: client("global").models.generate_content(model=MODEL, contents=contents, config=types.GenerateContentConfig(**cfg)))
    return r, time.time() - t


def describe(r):
    parts = []
    for c in (r.candidates or []):
        for p in (c.content.parts or []):
            if p.text:
                parts.append("text:" + p.text[:400].replace("\n", " "))
            elif p.inline_data:
                parts.append(f"inline:{p.inline_data.mime_type}:{len(p.inline_data.data or b'')}B")
    fr = r.candidates[0].finish_reason if r.candidates else None
    return parts, fr, r.usage_metadata


def probe(name, summary, inputs, fn):
    try:
        r, dt = fn()
        parts, fr, um = describe(r)
        res = f"success {dt:.1f}s finish={fr} out_tokens={getattr(um,'candidates_token_count',None)} :: {' | '.join(parts)[:200]}"
        print(name, res)
    except Exception as e:  # noqa: BLE001
        res = f"failure: {str(e)[:230]}"
        print(name, res)
    log_call(MODEL, inputs, f"[probe {name}] {summary}", "-", res)


def ia(content, response_format=None, model=MODEL, gen_cfg=None, timeout=600):
    """One Interactions API call (REST). content: list of input parts. Returns (json, seconds)."""
    body = {"model": model, "input": [{"type": "user_input", "content": content}], "store": False}
    if response_format:
        body["response_format"] = response_format
    if gen_cfg:
        body["generation_config"] = gen_cfg
    t = time.time()
    r = session().post(URL, json=body, timeout=timeout)
    dt = time.time() - t
    if r.status_code >= 400:
        raise RuntimeError(f"HTTP {r.status_code} {r.text[:300]}")
    return r.json(), dt


def ia_summary(j):
    out = []
    for st in j.get("steps", []):
        if st.get("type") == "model_output":
            for c in st.get("content", []):
                if c.get("type") == "text":
                    out.append("text:" + c["text"][:300].replace("\n", " "))
                else:
                    out.append(f"{c.get('type')}:{c.get('mime_type')}:{len(c.get('data') or '')}b64 uri={c.get('uri')}")
        elif st.get("type") == "thought":
            out.append("thought")
    return out, j.get("usage", {}), j.get("status")


def save_videos(j, name):
    """Write any inline video in an Interactions response to scratch/omni/<name>[-n].mp4 (or note its gcs uri). Returns paths."""
    OUT.mkdir(parents=True, exist_ok=True)
    paths, n = [], 0
    for st in j.get("steps", []):
        for c in st.get("content", []) if st.get("type") == "model_output" else []:
            if c.get("type") == "video" and c.get("data"):
                f = OUT / f"{name}{'' if n == 0 else '-' + str(n)}.mp4"
                f.write_bytes(base64.b64decode(c["data"]))
                paths.append(str(f)); n += 1
    return paths


def iprobe(name, summary, inputs, fn):
    try:
        j, dt = fn()
        saved = save_videos(j, name)
        parts, usage, status = ia_summary(j)
        res = f"success {dt:.1f}s status={status} out_tokens={usage.get('total_output_tokens')} :: {' | '.join(parts)[:200]} {saved}"
    except Exception as e:  # noqa: BLE001
        res = f"failure: {str(e)[:230]}"
    print(name, res)
    log_call(MODEL, inputs, f"[probe {name}] {summary}", "-", res)


def b64(path):
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode()


def img_part(path, mime="image/png"):
    return types.Part.from_bytes(data=pathlib.Path(path).read_bytes(), mime_type=mime)


def vid_part(path):
    return types.Part.from_bytes(data=pathlib.Path(path).read_bytes(), mime_type="video/mp4")


def run(which):
    day = KF / "rowhouses-day.png"
    if which == "text":
        probe("text", "text in/out: say what you are", "none", lambda: gc("In two sentences, say which model you are and what you can output (text, image, video, audio).", max_output_tokens=400))
    elif which == "img2text":
        probe("img2text", "image in -> text: describe architecture", "rowhouses-day.png",
              lambda: gc([img_part(day), "Describe the camera, buildings, floors and light in this picture in 3 sentences."], max_output_tokens=500))
    elif which == "img2img":
        probe("img2img", "image in -> image out, modalities IMAGE", "rowhouses-day.png",
              lambda: gc([img_part(day), "Edit this image: same camera and buildings, turn it into blue hour with warm window lights."], response_modalities=["IMAGE"]))
        probe("img2img-ti", "image in -> image out, modalities TEXT+IMAGE", "rowhouses-day.png",
              lambda: gc([img_part(day), "Edit this image: same camera and buildings, turn it into blue hour with warm window lights."], response_modalities=["TEXT", "IMAGE"]))
    elif which == "vid2text":
        probe("vid2text", "video in -> text: watch the Veo preview and describe changes + any morphing", "videos/rowhouses-A.mp4 (720p preview)",
              lambda: gc([vid_part(VID / "rowhouses-A.mp4"), "Watch this clip. In 5 bullet points describe how the scene changes over time and say whether any building changes shape, floors or windows appear or vanish."], max_output_tokens=900))
    elif which == "modal":
        for m in (["VIDEO"], ["AUDIO"], ["TEXT", "VIDEO"]):
            probe("modal-" + "+".join(m), f"generateContent response_modalities={m}", "none (text prompt)",
                  lambda m=m: gc("A 3 second clip of clouds.", response_modalities=m))
    elif which == "gc-old":
        probe("gc-old-text", "generateContent on gemini-omni-flash-preview (old id)", "none",
              lambda: (lambda t: (client("global").models.generate_content(model="gemini-omni-flash-preview", contents="Say hello."), time.time() - t))(time.time()))
    elif which == "i-text":
        iprobe("i-text", "Interactions API text in/out", "none", lambda: ia([{"type": "text", "text": "In two sentences, say which model you are and what you can output (text, image, video, audio)."}]))
    elif which == "i-img2text":
        iprobe("i-img2text", "Interactions API image in -> text", "rowhouses-day.png",
               lambda: ia([{"type": "text", "text": "Describe the camera, buildings, floors and light in this picture in 3 sentences."},
                           {"type": "image", "data": b64(day), "mime_type": "image/png"}]))
    elif which == "i-vid2text":
        iprobe("i-vid2text", "Interactions API video in -> text (Veo preview, 720p)", "videos/rowhouses-A.mp4",
               lambda: ia([{"type": "text", "text": "Watch this clip. In 5 bullet points describe how the scene changes over time and say whether any building changes shape, or floors/windows appear or vanish."},
                           {"type": "video", "data": b64(VID / "rowhouses-A.mp4"), "mime_type": "video/mp4"}]))
    elif which == "i-img2text-t":
        iprobe("i-img2text-t", "Interactions API image in -> text, response_format text", "rowhouses-day.png",
               lambda: ia([{"type": "text", "text": "Describe the camera, buildings, floors and light in this picture in 3 sentences."},
                           {"type": "image", "data": b64(day), "mime_type": "image/png"}], response_format=[{"type": "text"}]))
    elif which == "i-vid2text-t":
        iprobe("i-vid2text-t", "Interactions API video in -> text, response_format text", "videos/rowhouses-A.mp4",
               lambda: ia([{"type": "text", "text": "Watch this clip. In 5 bullet points describe how the scene changes over time and say whether any building changes shape, or floors/windows appear or vanish."},
                           {"type": "video", "data": b64(VID / "rowhouses-A.mp4"), "mime_type": "video/mp4"}], response_format=[{"type": "text"}]))
    elif which in ("fl-720", "fl-4k"):
        res = "720p" if which == "fl-720" else "4k"
        prompt = ("The first image is the first frame and the second image is the last frame. A locked-off camera. Over eight seconds the daylight "
                  "fades into blue hour: the sky turns from golden to deep blue and rose, the windows, balconies and car porches turn on one after "
                  "another with a warm amber glow, and the lamps and brick uplighting come on. The people walk slowly. The architecture is rigid: "
                  "every building, floor count, window and road stays exactly as in the first frame. No audio. Avoid: buildings morphing, new "
                  "buildings, text, logos, flicker, camera shake.")
        rf = [{"type": "video", "delivery": "uri", "gcs_uri": "gs://parshwanath-infra-veo/review/omni/", "aspect_ratio": "16:9", "resolution": res, "duration": "8s"}] if res == "4k" else \
             [{"type": "video", "delivery": "inline", "aspect_ratio": "16:9", "resolution": res, "duration": "8s"}]
        iprobe(which, f"Omni first+last frame {res} 8s (same frames/prompt as Veo rowhouses-A)", "rowhouses-day.png + rowhouses-dusk.png",
               lambda: ia([{"type": "text", "text": prompt}, {"type": "image", "data": b64(day), "mime_type": "image/png"},
                           {"type": "image", "data": b64(KF / "rowhouses-dusk.png"), "mime_type": "image/png"}],
                          response_format=rf, gen_cfg={"video_config": {"task": "image_to_video"}}))
    elif which == "i-img":
        for mods in (["image"], ["text", "image"]):
            iprobe("i-image-out-" + "+".join(mods), f"Interactions API image out, response_format {mods}", "rowhouses-day.png",
                   lambda mods=mods: ia([{"type": "text", "text": "Edit this image: same camera and buildings, blue hour with warm window lights."},
                                         {"type": "image", "data": b64(day), "mime_type": "image/png"}], response_format=[{"type": m} for m in mods]))
    elif which == "i-audio":
        iprobe("i-audio-out", "Interactions API audio out", "none", lambda: ia([{"type": "text", "text": "Say hello."}], response_format=[{"type": "audio"}]))
    else:
        raise SystemExit("unknown probe")


if __name__ == "__main__":
    run(sys.argv[1])
