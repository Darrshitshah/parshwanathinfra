"""Pose-bridge for the NEW hero film (lead B): re-time the head of a take so its first frame lines up with another clip's last frame.

    python tools/imagegen/hero_new_b_align.py TAKE.mp4 TARGET_FRAME.jpg OUT.mp4 [ease_seconds=1.2]
Homography (SIFT + MAGSAC) from TAKE's first frame onto TARGET_FRAME; each of the first `ease` seconds of TAKE is warped by that homography
eased back to identity (smoothstep), so frame 0 sits on the target pose and from `ease` seconds on the take is untouched. Re-encodes at CRF 12.
"""
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np

FF = imageio_ffmpeg.get_ffmpeg_exe()


def read_frames(path):
    p = subprocess.Popen([FF, "-loglevel", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    w, h = 3840, 2160
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)


def homog(a, b):
    ga, gb = (cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in (a, b))
    sift = cv2.SIFT_create(6000)
    k1, d1 = sift.detectAndCompute(cv2.resize(ga, None, fx=.5, fy=.5), None)
    k2, d2 = sift.detectAndCompute(cv2.resize(gb, None, fx=.5, fy=.5), None)
    m = cv2.BFMatcher().knnMatch(d1, d2, k=2)
    g = [x for x, y in m if x.distance < .75 * y.distance]
    pa = np.float32([k1[x.queryIdx].pt for x in g]) * 2
    pb = np.float32([k2[x.trainIdx].pt for x in g]) * 2
    H, inl = cv2.findHomography(pa, pb, cv2.USAC_MAGSAC, 4)
    return H, int(inl.sum())


def main(take, target, out, ease=1.2, fps=24):
    tgt = cv2.imread(target)
    frames = read_frames(take)
    first = next(frames)
    H, n = homog(first, tgt)
    print("homography inliers", n)
    w, h = 3840, 2160
    proc = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
                             "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    I = np.eye(3)
    i = 0
    for f in [first] + list(frames):
        t = i / fps
        s = min(t / ease, 1.0)
        s = s * s * (3 - 2 * s)
        if s < 1.0:
            Ht = (1 - s) * H + s * I
            f = cv2.warpPerspective(f, Ht, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        proc.stdin.write(f.tobytes())
        i += 1
    proc.stdin.close(); proc.wait()
    print("wrote", out, i, "frames")


if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], a[3], float(a[4]) if len(a) > 4 else 1.2)
