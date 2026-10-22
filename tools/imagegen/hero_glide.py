"""seg4b: programmatic bridge from stage-5-aligned (end of seg4) to the ORIGINAL stage-5 keyframe (start of lead B's seg5). No model.

    ~/.local/bin/uv run --no-project --python 3.12 --with opencv-python-headless --with numpy --with imageio-ffmpeg \
      python tools/imagegen/hero_glide.py [--seconds 1.5] [--mode grow|dissolve] [--out NAME]

The buildings are the same pixels in both frames (stage-5-aligned holds kf5's site warped by G = H(kf5->kf3), a few px), so:
  * camera: the homography eases from G (aligned framing) to identity (original framing), smoothstep, 24 fps;
  * surroundings: kf3's surroundings give way to kf5's (road loop, trees, fields), spreading outward from the site ("grow") or as a
    uniform dissolve ("dissolve"), with the same easing; the site itself never changes.
Frame 0 is stage-5-aligned.png and the last frame is frames-4k/stage-5.jpg, both copied exactly (the stage-5 file is never written).
Output: _source/generated/video/hero/<NAME>.mp4 (3840x2160 H.264 CRF 12, no audio) + .prompt.txt notes, preview in scratchpad hero-a.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
AL = ROOT / "_source/generated/hero-keyframes/aligned"
FR = ROOT / "_source/generated/hero-keyframes/frames-4k"
OUT = ROOT / "_source/generated/video/hero"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-a")
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 3840, 2160, 24
SOFT = 0.35  # width of the growth front, as a share of the normalised distance from the site


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def warp(img, M, interp=cv2.INTER_LANCZOS4):
    return cv2.warpPerspective(img, M, (W, H), flags=interp, borderMode=cv2.BORDER_REFLECT)


def lerp_h(G, e):
    M = (1 - e) * (G / G[2, 2]) + e * np.eye(3)
    return M / M[2, 2]


def frames(seconds, mode):
    G = np.array(json.loads((AL / "aligned.json").read_text())["kf_to_kf3"]["5"])
    Gi = np.linalg.inv(G)
    start = cv2.imread(str(AL / "stage-5-aligned.png"))
    kf5 = cv2.imread(str(FR / "stage-5.jpg"))
    kf3 = cv2.imread(str(FR / "stage-3.jpg"))
    alpha = cv2.imread(str(AL / "stage-5-alpha.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0  # kf3 frame
    # normalised distance from the site, in the kf3 frame (0 at the site, 1 at the farthest pixel)
    small = cv2.resize((alpha > 0.5).astype(np.uint8), (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
    d = cv2.distanceTransform(1 - small, cv2.DIST_L2, 5)
    d = cv2.resize(d / max(d.max(), 1.0), (W, H), interpolation=cv2.INTER_LINEAR)
    n = max(2, round(seconds * FPS))
    for i in range(n):
        t = i / (n - 1)
        if i == 0:
            yield start
            continue
        if i == n - 1:
            yield kf5
            continue
        e = float(smoothstep(t))
        Gt = lerp_h(G, e)              # kf5 frame -> output frame
        Rt = Gt @ Gi                   # kf3 frame -> output frame
        a_site = warp(alpha, Rt, cv2.INTER_LINEAR)[..., None]
        if mode == "grow":
            front = e * (1 + SOFT)
            a_env = smoothstep((front - warp(d, Rt, cv2.INTER_LINEAR)) / SOFT)[..., None]
        else:
            a_env = np.full((H, W, 1), e, np.float32)
        w5 = a_site + (1 - a_site) * a_env
        img = warp(kf5, Gt).astype(np.float32) * w5 + warp(kf3, Rt).astype(np.float32) * (1 - w5)
        yield img.round().clip(0, 255).astype(np.uint8)


def encode(gen, dest):
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dest)],
                         stdin=subprocess.PIPE)
    count = 0
    for f in gen:
        p.stdin.write(f.tobytes())
        count += 1
    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError("ffmpeg failed")
    return count


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seconds", type=float, default=1.5)
    ap.add_argument("--mode", choices=("grow", "dissolve"), default="grow")
    ap.add_argument("--out", default="seg4b-glide")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{a.out}.mp4"
    n = encode(frames(a.seconds, a.mode), dest)
    G = json.loads((AL / "aligned.json").read_text())["kf_to_kf3"]["5"]
    (OUT / f"{a.out}.prompt.txt").write_text(
        f"programmatic (no model): {n} frames at {FPS} fps = {n / FPS:.2f} s, mode={a.mode}, smoothstep easing.\n"
        f"first frame = hero-keyframes/aligned/stage-5-aligned.png (end of seg4), last frame = hero-keyframes/frames-4k/stage-5.jpg (start of seg5).\n"
        f"camera: homography from G = H(kf5->kf3) to identity; G = {G}\n"
        "surroundings: kf3's give way to kf5's outward from the site; the site pixels are kf5's throughout.\n")
    prev = SCR / f"{a.out}.mp4"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(dest), "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(prev)], check=True)
    print(f"wrote {dest} ({n} frames, {dest.stat().st_size // 1_000_000} MB), preview {prev} ({prev.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
