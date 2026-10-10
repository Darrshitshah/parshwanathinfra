"""Prepare the exact 16:9 keyframes each Veo clip starts and ends on (Veo takes 16:9 or 9:16 only).
Writes _source/generated/keyframes/<id>.png (2560x1440) + <id>.prompt.txt (how it was derived), WebP previews and a
contact sheet into the given preview dir. Usage: python tools/imagegen/keyframes.py <preview_dir>"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from PIL import Image
from _lib import GEN, V2, log_call

Image.MAX_IMAGE_PIXELS = None
KF = GEN / "keyframes"
OUT_W, OUT_H = 2560, 1440
# id -> (source file, crop-box fn(w, h) -> (l, t, r, b), note)
def top_crop(off):  # 3:2 -> 16:9 keeping the horizon, vertical offset in source px
    return lambda w, h: (0, off, w, off + round(w * 9 / 16))
def centre_crop(w, h):
    cw = round(h * 16 / 9)
    return ((w - cw) // 2, 0, (w - cw) // 2 + cw, h)
def whole(w, h):
    return (0, 0, w, h)

FRAMES = {
    "dive-start-sky": (GEN / "sky-dive-first-frame.png", whole, "Nano Banana sky plate sky-dive-first-frame, resized to 2560x1440."),
    "dive-end-ss01": (V2 / "SS-01 Masterplan Aerial - hiranandani.png", top_crop(150), "SS-01 v2 photoreal, 16:9 crop (3:2 source, 150 px from the top), unmodified pixels, resized."),
    "orbit-start-ss33": (V2 / "SS-33 Masterplan Aerial Full - hiranandani.png", whole, "SS-33 v2 photoreal, native 16:9, unmodified, resized."),
    "rowhouses-day": (V2 / "SS-26 Row Houses by Day - hiranandani.png", centre_crop, "SS-26 v2 photoreal, centred 16:9 crop (outer units trimmed), unmodified, resized."),
    "rowhouses-dusk": (GEN / "ss26-row-houses-dusk.png", centre_crop, "Nano Banana dusk of SS-26, identical centred 16:9 crop as rowhouses-day, resized."),
}

def main(prev_dir):
    import pathlib
    prev = pathlib.Path(prev_dir); prev.mkdir(parents=True, exist_ok=True); KF.mkdir(parents=True, exist_ok=True)
    thumbs = []
    for kid, (src, crop, note) in FRAMES.items():
        im = Image.open(src).convert("RGB")
        im = im.crop(crop(*im.size)).resize((OUT_W, OUT_H), Image.LANCZOS)
        im.save(KF / f"{kid}.png")
        (KF / f"{kid}.prompt.txt").write_text(f"No generation call. Derived keyframe: {note}\nSource: {src}\n")
        small = im.resize((1280, 720), Image.LANCZOS)
        q = 80
        while True:
            small.save(prev / f"{kid}.webp", quality=q)
            if (prev / f"{kid}.webp").stat().st_size < 400_000 or q < 40: break
            q -= 8
        thumbs.append((kid, small.resize((640, 360), Image.LANCZOS)))
        print(kid, (prev / f"{kid}.webp").stat().st_size // 1024, "KB")
    sheet = Image.new("RGB", (640 * 2 + 30, (360 + 10) * 3 + 10), (24, 24, 24))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for i, (kid, t) in enumerate(thumbs):
        x, y = 10 + (i % 2) * 650, 10 + (i // 2) * 370
        sheet.paste(t, (x, y)); d.rectangle((x, y, x + 230, y + 16), fill=(0, 0, 0)); d.text((x + 4, y + 2), kid, fill=(255, 255, 255))
    sheet.save(prev / "contact-sheet.png")
    log_call("(local crop, no model call)", "SS-01, SS-33, SS-26 v2 + generated plates", "prepared 16:9 keyframes", "_source/generated/keyframes/*.png", "success")

if __name__ == "__main__":
    main(sys.argv[1])
