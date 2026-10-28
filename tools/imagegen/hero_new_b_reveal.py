"""Programmatic district reveal (fallback / alternative to the Veo grow take), NEW hero film lead B.

Two pixel-aligned stills (new-b-nod.jpg = SS-01 without the row-house district, ss01.jpg) and the district mask: inside the mask the
SS-01 pixels are revealed row by row, front to back, each strip rising a few pixels into place under a soft edge; outside the mask the
two stills are identical so nothing else moves. Camera locked, so there is no ghosting of the blocks.
    python tools/imagegen/hero_new_b_reveal.py OUT.mp4 [seconds=4.0] [hold=1.0] [fps=24]   (needs numpy, opencv-python-headless, imageio-ffmpeg)
"""
import pathlib
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
FR = ROOT / "_source/generated/hero-keyframes/frames-4k"
SCR = pathlib.Path("/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-new-b")


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def main(out, seconds=4.0, hold=1.0, fps=24, rise_px=26.0, soft=0.40):
    a = cv2.imread(str(FR / "new-b-nod.jpg")).astype(np.float32)
    b = cv2.imread(str(FR / "ss01.jpg")).astype(np.float32)
    m = np.load(SCR / "district-mask.npy").astype(np.float32)
    ys, xs = np.where(m > 0.02)
    y0, y1, x0, x1 = max(ys.min() - 40, 0), min(ys.max() + 40, a.shape[0]), max(xs.min() - 40, 0), min(xs.max() + 40, a.shape[1])
    A, B, M = a[y0:y1, x0:x1], b[y0:y1, x0:x1], m[y0:y1, x0:x1]
    h, w = M.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    p = 0.72 * (1 - yy / h) + 0.28 * (xx / w)  # 0 = front/left strips first, 1 = back/right last
    p = (p - p.min()) / (p.max() - p.min())
    n = int(round(seconds * fps))
    nh = int(round(hold * fps))
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{a.shape[1]}x{a.shape[0]}", "-r", str(fps), "-i", "-",
                             "-an", "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
    for i in range(n + nh):
        t = smooth(min(i / max(n - 1, 1), 1.0))
        al = smooth((t * (1 + soft) - p) / soft) * M  # per-pixel reveal, limited by the district mask
        # rising: the revealed pixels are sampled from slightly lower, easing up to 0 as the strip completes
        sh = rise_px * (1 - smooth((t * (1 + soft) - p) / soft))
        mapy = (yy + sh).astype(np.float32)
        mapx = xx.astype(np.float32)
        Bs = cv2.remap(B, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        roi = A * (1 - al[..., None]) + Bs * al[..., None]
        frame = a.copy()
        frame[y0:y1, x0:x1] = roi
        proc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
    proc.stdin.close()
    proc.wait()
    print("wrote", out, n + nh, "frames")


if __name__ == "__main__":
    s = sys.argv
    main(s[1], float(s[2]) if len(s) > 2 else 4.0, float(s[3]) if len(s) > 3 else 1.0, int(s[4]) if len(s) > 4 else 24)
