"""NEW hero film, lead B (closing half): Nano Banana keyframes and Veo takes into _source/generated/video/hero/new/.
Reuses hero_seg5 (veo / omni / review / strip helpers) with the output folder switched.
Run from the project folder (quote the path, it ends with a space):
  GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow \
    --with google-cloud-storage --with imageio-ffmpeg --with numpy python tools/imagegen/hero_new_b.py <cmd> ...
  kf <name> <prompt-key> <input1> [input2 ...]    one Nano Banana 4K edit -> _source/generated/hero-keyframes/<name>.png
  take veo <name> <prompt-key> <first> <last> [secs=8]
  strip <name> <out> [n=12] [cols=3] [width=560] [t0] [t1]
Frames: a path, or a name under hero-keyframes/frames-4k/ (.jpg).
"""
import pathlib
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import hero_seg5 as H  # noqa: E402
from _lib import GEN, gen_image  # noqa: E402
from PIL import Image  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
NEW = GEN / "video" / "hero" / "new"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-new-b")
H.OUT = NEW
H.SCR = SCR
(SCR / "frames").mkdir(parents=True, exist_ok=True)
(SCR / "takes").mkdir(parents=True, exist_ok=True)
NEW.mkdir(parents=True, exist_ok=True)

KF = {
    "NOD1": ("STRICT EDIT of IMAGE 1, an aerial render of a township. The result must line up with IMAGE 1 when laid over it: same camera, same "
             "horizon, same positions of every tall apartment block, road, lawn and tree outside the area being changed. TASK: remove every long, low "
             "row-house strip (the two and three storey terraced rows with gabled or flat terraced roofs): the whole group in the upper left corner "
             "and the centre back, the gabled houses at the far left, the rows along the small palm-lined lane, and the rows behind the tall blocks. "
             "Also remove that lane. In their place show undeveloped countryside: open fields, hedgerows and mature trees, in the same style, light "
             "and colours as the rest of the surroundings in IMAGE 1, with no road, no path and no building there. KEEP EXACTLY every taller "
             "apartment block (five and six floors, khaki walls, white window frames), its roof, its shape and its position, the lawns, the parking "
             "forecourt, the road on the right, the left tall block with the stepped roofs, and all trees outside the removed area. Where a tall "
             "block's wall meets the removed area the wall stays intact and fully visible. Same golden-hour light and shadows direction. Do not "
             "crop, reframe or change the camera. No text, letters, logos or watermarks."),
}


def kf(name, key, inputs):
    ins = [H.frame_path(i) for i in inputs]
    p = KF.get(key, key)
    dest = gen_image(f"hero-keyframes/{name}", p, inputs=ins, aspect="16:9", size="4K", summary=f"[hero new B] {name}: {p[:150]}")
    if dest:
        im = Image.open(dest).convert("RGB").resize((3840, 2160), Image.LANCZOS)
        im.save(GEN / "hero-keyframes" / "frames-4k" / f"{name}.jpg", quality=95)
        im.resize((1920, 1080), Image.LANCZOS).save(SCR / "frames" / f"{name}-1920.jpg", quality=88)
        print("kf ->", GEN / "hero-keyframes" / "frames-4k" / f"{name}.jpg", "| preview", SCR / "frames" / f"{name}-1920.jpg")


if __name__ == "__main__":
    c = sys.argv[1]
    if c == "kf":
        kf(sys.argv[2], sys.argv[3], sys.argv[4:])
    elif c == "take":
        a = sys.argv[2:]
        from hero_new_b_prompts import PV  # noqa: F401  (prompt table, optional)
        H.PROMPTS.update(PV)
        if a[2].startswith("SEG4"):  # the construction takes need cranes and netting; the finished-township takes forbid them
            H.NEG = ("camera movement, zoom, push-in, dolly, pan, tilt, orbit, fly-through, cut, scene change, close-up, towers, skyscrapers, high-rise, "
                     "tall buildings, extra floors, buildings shrinking, giant cranes, new buildings, buildings outside the site, morphing, melting, "
                     "semi-transparent walls, text, letters, logos, watermark, flicker, people close to camera")
        H.take(a[0], a[1], a[2], a[3], a[4], int(a[5]) if len(a) > 5 else 8)
    elif c == "strip":
        a = sys.argv[2:]
        print(H.strip_image(NEW / f"{a[0]}.mp4", SCR / "frames" / f"{a[1]}.jpg", int(a[2]) if len(a) > 2 else 12, int(a[3]) if len(a) > 3 else 3,
                            int(a[4]) if len(a) > 4 else 560, float(a[5]) if len(a) > 5 else None, float(a[6]) if len(a) > 6 else None))
    else:
        raise SystemExit(__doc__)
