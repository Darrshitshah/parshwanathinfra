"""Programmatic 'rise through a bank of golden mist' transition (fallback for the Veo mist take), hero NEW film lead B.

Frame A (stage-5 family, e.g. seg5-mid1) is pushed in slowly while a drifting bank of warm mist (fbm noise, sweeping down the frame as the
camera rises) thickens to full cover; under full cover the picture swaps to frame B (e.g. ss01), which then eases back out to its exact
framing while the mist thins and clears. Nothing dissolves: the change of layout is hidden by the mist, the camera never cuts.
    python tools/imagegen/hero_new_b_mist.py A.jpg B.jpg OUT.mp4 [seconds=6.5] [fps=24]
"""
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def fbm(h, w, rng, octaves=5, base=5):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = max(2, base * 2 ** o)
        g = rng.random((int(n * h / w) + 3, n + 3)).astype(np.float32)
        out += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
        tot += amp
        amp *= 0.5
    return out / tot


def zoom(img, s, cx=0.5, cy=0.62):
    h, w = img.shape[:2]
    M = np.array([[s, 0, (1 - s) * cx * w], [0, s, (1 - s) * cy * h]], np.float32)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


def main(fa, fb, out, seconds=6.5, fps=24, push=0.10):
    A = cv2.imread(fa); B = cv2.imread(fb)
    h, w = A.shape[:2]
    rng = np.random.default_rng(7)
    mh, mw = h // 6, w // 6
    layers = [fbm(mh * 3, mw, rng, 5, 4) for _ in range(2)]  # tall tiles, scrolled downward (camera rises)
    n = int(round(seconds * fps))
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-", "-an",
                             "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    swap_t = 0.44  # fraction of the clip where the picture swaps (full cover)
    yy, xx = np.mgrid[0:mh, 0:mw].astype(np.float32)
    glow = np.exp(-(((xx / mw) - 0.12) ** 2 / 0.12 + ((yy / mh) - 0.0) ** 2 / 0.25)).astype(np.float32)
    for i in range(n):
        t = i / (n - 1)
        # camera: A pushes in to 1+push, B starts there and eases out to exactly 1.0
        if t < swap_t:
            u = smooth(t / swap_t)
            img = zoom(A, 1.0 + push * u * 0.8)
        else:
            u = smooth((t - swap_t) / (1 - swap_t))
            img = zoom(B, 1.0 + push * (1 - u) * 0.9 + 0.012 * (1 - u))
        # mist: coverage envelope (0 -> 1 at the swap -> 0), noise thresholded so it builds up and thins out unevenly
        cover = np.exp(-((t - swap_t) / 0.115) ** 2)  # narrow bell around the swap
        cover = np.clip(cover * 1.08, 0, 1)
        sc = (t * 3.2) * mh  # scroll downward with time
        field = np.zeros((mh, mw), np.float32)
        for k, L in enumerate(layers):
            off = int(sc * (0.7 + 0.5 * k)) % (mh * 2)
            tile = L[off:off + mh] if off + mh <= L.shape[0] else np.concatenate([L[off:], L[:off + mh - L.shape[0]]])
            field += tile / len(layers)
        field = (field - field.min()) / (field.max() - field.min() + 1e-6)
        # threshold sweeps with coverage: at cover=1 the whole frame is above it
        thr = 1.0 - cover * 1.35
        a = smooth((field - thr) / 0.28) * min(1.0, cover * 1.25)
        a = np.clip(a + glow * cover * 0.25, 0, 1)
        a = cv2.resize(cv2.GaussianBlur(a, (0, 0), 3), (w, h), interpolation=cv2.INTER_CUBIC)[..., None]
        tint = np.array([212, 236, 255], np.float32)  # BGR warm white-gold
        fld = cv2.resize(field, (w, h))[..., None]
        gy = np.linspace(1.08, 0.9, h, dtype=np.float32)[:, None, None]
        shade = (0.74 + 0.36 * fld ** 1.4) * gy
        frame = img.astype(np.float32) * (1 - a) + tint * shade * a
        proc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
    proc.stdin.close(); proc.wait()
    print("wrote", out, n, "frames")


if __name__ == "__main__":
    s = sys.argv
    main(s[1], s[2], s[3], float(s[4]) if len(s) > 4 else 6.5, int(s[5]) if len(s) > 5 else 24)
