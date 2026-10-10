"""Step 3: Veo 3.1 image-to-video, one request at a time. Usage: python tools/imagegen/video.py <clip> <A|B> [retry-suffix]
clips: dive, orbit, rowhouses. Output: _source/generated/video/<clip>-<A|B>[suffix].mp4 (+ .prompt.txt). Logged to docs/IMAGEGEN_LOG.md."""
import os
import sys
import time
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from google.genai import types
from _lib import GEN, PROJECT, VIDEO_MODEL, backoff, client, log_call

KF = GEN / "keyframes"
RESOLUTION = os.environ.get("VEO_RESOLUTION", "4k")  # highest first; a 400 on an unsupported value is free, fall back to 1080p
QUALITY = os.environ.get("VEO_QUALITY", "LOSSLESS")  # LOSSLESS at 4k needs a GCS output bucket (the API refuses inline)
BUCKET = os.environ.get("VEO_BUCKET", "parshwanath-infra-veo")  # private, us-central1, uniform access, public access prevention
DURATION = int(os.environ.get("VEO_DURATION", "8"))
OUT = GEN / "video"
NEG = ("buildings morphing, melting or changing shape, new buildings, extra floors, text, letters, logos, watermark, "
       "people appearing from nowhere, birds, aircraft, flicker, camera shake, cartoon look")
STAY = "The architecture is rigid: every building, floor count, window and road stays exactly as in the first frame. "

CLIPS = {
    ("dive", "A"): dict(first="dive-start-sky", last="dive-end-ss01", prompt=(
        "A smooth continuous drone descent. The camera starts high above soft golden clouds and glides forward and down through "
        "the cloud layer, the clouds parting around the lens, and emerges into clear air above the township as the horizon "
        "settles into the framing of the last frame. Slow, steady, no shake, no camera roll. Warm golden-hour light "
        "throughout. " + STAY)),
    ("dive", "B"): dict(first="dive-start-sky", last="dive-end-ss01", prompt=(
        "A steeper, faster plunge. The camera tips downward and dives quickly, the golden clouds parting early and sweeping "
        "past the edges of the frame, then breaks into clear air and swoops down toward the township, decelerating smoothly "
        "into the framing of the last frame. Confident cinematic speed, no shake, no camera roll, warm golden-hour light. " + STAY)),
    ("orbit", "A"): dict(first="orbit-start-ss33", last=None, prompt=(
        "A very slow, steady drone orbit around the township, the camera drifting about fifteen degrees to the right while "
        "keeping the buildings in frame, with a gentle forward push-in. Soft golden-hour light, trees and palms swaying slightly "
        "in the breeze, a few small vehicles moving along the road. " + STAY)),
    ("orbit", "B"): dict(first="orbit-start-ss33", last=None, prompt=(
        "A slow, steady drone push-in straight toward the central courtyards of the township, the camera moving forward and "
        "slightly downward so the central buildings and courtyard greens grow larger, no sideways orbit. Soft golden-hour "
        "light, trees and palms swaying slightly, a few small vehicles moving along the road. " + STAY)),
    ("rowhouses", "A"): dict(first="rowhouses-day", last="rowhouses-dusk", prompt=(
        "A locked-off camera. Over eight seconds the daylight fades into blue hour: the sky turns from golden to deep blue "
        "and rose, the windows, balconies and car porches turn on one after another with a warm amber glow, and the lamps and "
        "brick uplighting come on. The people walk slowly. " + STAY)),
    ("rowhouses", "B"): dict(first="rowhouses-day", last="rowhouses-dusk", prompt=(
        "A slow, smooth lateral dolly along the street, the camera gliding sideways parallel to the facades at walking pace. "
        "Over eight seconds the daylight fades into blue hour: the sky turns from golden to deep blue and rose, the windows, "
        "balconies and car porches turn on one after another with a warm amber glow, and the lamps come on. The people walk "
        "slowly. " + STAY)),
}


def img(name):
    return types.Image(image_bytes=(KF / f"{name}.png").read_bytes(), mime_type="image/png")


def run(clip, ver, suffix=""):
    spec = CLIPS[(clip, ver)]
    OUT.mkdir(parents=True, exist_ok=True)
    name = f"{clip}-{ver}{suffix}"
    dest = OUT / f"{name}.mp4"
    (OUT / f"{name}.prompt.txt").write_text(
        f"model={VIDEO_MODEL} {RESOLUTION} 16:9 {DURATION}s no audio enhance_prompt=True quality={QUALITY}\nfirst={spec['first']} last={spec['last']}\nnegative={NEG}\n\n{spec['prompt']}\n")
    cfg = dict(aspect_ratio="16:9", resolution=RESOLUTION, duration_seconds=DURATION, number_of_videos=1, generate_audio=False, enhance_prompt=True, compression_quality=QUALITY,
               output_gcs_uri=f"gs://{BUCKET}/{name}/",
               negative_prompt=NEG, person_generation="allow_adult")
    if spec["last"]:
        cfg["last_frame"] = img(spec["last"])
    ins = f"{spec['first']}.png" + (f" + last {spec['last']}.png" if spec["last"] else "")
    c = client("us-central1")
    try:
        op = backoff(lambda: c.models.generate_videos(model=VIDEO_MODEL, prompt=spec["prompt"], image=img(spec["first"]),
                                                      config=types.GenerateVideosConfig(**cfg)))
        while not op.done:
            time.sleep(15)
            op = c.operations.get(op)
            print("  polling...", flush=True)
        if op.error or not op.response or not op.response.generated_videos:
            log_call(VIDEO_MODEL, ins, f"[{RESOLUTION} {DURATION}s] " + spec["prompt"], "-", f"failure: {op.error or getattr(op.response, 'rai_media_filtered_reasons', 'no video')}")
            print("FAILED", op.error)
            return None
        v = op.response.generated_videos[0].video
        if v.video_bytes:
            dest.write_bytes(v.video_bytes)
        else:  # saved to Cloud Storage: download with ADC (the gcloud CLI is not logged in here)
            from google.cloud import storage
            bkt, _, key = v.uri[5:].partition("/")
            storage.Client(project=PROJECT).bucket(bkt).blob(key).download_to_filename(str(dest))
        log_call(VIDEO_MODEL, ins, spec["prompt"], f"_source/generated/video/{name}.mp4", f"success {RESOLUTION} {DURATION}s {QUALITY} (fidelity check pending)")
        print("saved", dest, dest.stat().st_size // 1024, "KB")
        return dest
    except Exception as e:  # noqa: BLE001
        log_call(VIDEO_MODEL, ins, f"[{RESOLUTION} {DURATION}s] " + spec["prompt"], "-", f"failure: {str(e)[:200]}")
        raise


if __name__ == "__main__":
    run(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
