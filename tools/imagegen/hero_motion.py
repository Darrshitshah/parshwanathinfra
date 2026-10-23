"""Frame-to-frame motion curve of a video: a camera jump, a pop, a held frame or a ghosted dissolve shows up as a spike or a flat spot.

Run from the project folder (quote the path, it ends with a space):
  ~/.local/bin/uv run --no-project --python 3.12 --with pillow --with numpy --with imageio-ffmpeg --with opencv-python-headless python \\
      tools/imagegen/hero_motion.py VIDEO [--start S] [--end E] [--mark t1,t2,...] [--plot OUT.png] [--csv OUT.csv] [--list N]
Per frame, against the previous frame (both reduced to 480x270 grey): `mad` mean absolute difference (0..255), `dx` and `dy` the global
translation in pixels at that size (phase correlation; the 3840 px frame is 8 times larger), `resp` the correlation peak (near 1 = the same
picture shifted, low = the content changed or two images are mixed). --mark draws vertical lines (join times) on the plot.
--list N prints the N frames with the largest `mad` and the N with the largest |shift|.
"""
from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H = 480, 270


def grey_frames(path: Path, start: float, end: float | None):
    cmd = [FF, "-loglevel", "error", "-ss", f"{start:.4f}"]
    if end is not None:
        cmd += ["-t", f"{end - start:.4f}"]
    cmd += ["-i", str(path), "-an", "-vf", f"scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = W * H
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W)
    proc.wait()


def measure(path: Path, start: float, end: float | None, fps: float) -> list[dict]:
    win = cv2.createHanningWindow((W, H), cv2.CV_32F)
    rows, prev = [], None
    for k, fr in enumerate(grey_frames(path, start, end)):
        cur = fr.astype(np.float32)
        if prev is not None:
            mad = float(np.abs(cur - prev).mean())
            (dx, dy), resp = cv2.phaseCorrelate(prev.copy(), cur.copy(), win)  # the binding windows its inputs in place
            rows.append({"t": start + k / fps, "mad": mad, "dx": float(dx), "dy": float(dy), "resp": float(resp)})
        prev = cur
    return rows


def plot(rows: list[dict], marks: list[float], dest: Path) -> None:
    w, h, pad = 1800, 700, 50
    im = Image.new("RGB", (w, h), (250, 248, 244))
    d = ImageDraw.Draw(im)
    t0, t1 = rows[0]["t"], rows[-1]["t"]
    panels = [("mad", (0, 160, 0), 0.0, max(2.0, max(r["mad"] for r in rows) * 1.1)),
              ("shift px", (200, 60, 30), 0.0, max(2.0, max((r["dx"] ** 2 + r["dy"] ** 2) ** 0.5 for r in rows) * 1.1)),
              ("resp", (40, 80, 200), 0.0, 1.0)]
    ph = (h - 2 * pad) // len(panels)
    for i, (name, col, lo, hi) in enumerate(panels):
        y0 = pad + i * ph
        d.rectangle([pad, y0, w - pad, y0 + ph - 8], outline=(190, 190, 190))
        d.text((pad + 4, y0 + 2), f"{name} (max {hi:.2f})", fill=(0, 0, 0))
        pts = []
        for r in rows:
            v = r["mad"] if name == "mad" else ((r["dx"] ** 2 + r["dy"] ** 2) ** 0.5 if name == "shift px" else r["resp"])
            x = pad + (r["t"] - t0) / max(1e-6, t1 - t0) * (w - 2 * pad)
            y = y0 + ph - 8 - (v - lo) / (hi - lo) * (ph - 12)
            pts.append((x, y))
        d.line(pts, fill=col, width=2)
        for m in marks:
            if t0 <= m <= t1:
                x = pad + (m - t0) / (t1 - t0) * (w - 2 * pad)
                d.line([(x, y0), (x, y0 + ph - 8)], fill=(120, 120, 120), width=1)
    for s in range(int(t0), int(t1) + 1, max(1, int((t1 - t0) // 20) or 1)):
        x = pad + (s - t0) / max(1e-6, t1 - t0) * (w - 2 * pad)
        d.text((x - 6, h - pad + 8), f"{s}", fill=(0, 0, 0))
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--fps", type=float, default=24.0)
    ap.add_argument("--mark", default="")
    ap.add_argument("--plot")
    ap.add_argument("--csv")
    ap.add_argument("--list", type=int, default=0)
    args = ap.parse_args(argv)
    rows = measure(Path(args.video), args.start, args.end, args.fps)
    if not rows:
        print("no frames", file=sys.stderr)
        return 1
    marks = [float(v) for v in args.mark.split(",") if v.strip()]
    if args.csv:
        Path(args.csv).parent.mkdir(parents=True, exist_ok=True)
        with open(args.csv, "w", newline="") as fh:
            wr = csv.DictWriter(fh, fieldnames=["t", "mad", "dx", "dy", "resp"])
            wr.writeheader()
            wr.writerows(rows)
    if args.plot:
        plot(rows, marks, Path(args.plot))
    if args.list:
        print("largest mad:")
        for r in sorted(rows, key=lambda r: -r["mad"])[: args.list]:
            print(f"  t={r['t']:.3f} mad={r['mad']:.2f} dx={r['dx']:.2f} dy={r['dy']:.2f} resp={r['resp']:.2f}")
        print("largest shift:")
        for r in sorted(rows, key=lambda r: -(r["dx"] ** 2 + r["dy"] ** 2))[: args.list]:
            print(f"  t={r['t']:.3f} mad={r['mad']:.2f} dx={r['dx']:.2f} dy={r['dy']:.2f} resp={r['resp']:.2f}")
    med = float(np.median([r["mad"] for r in rows]))
    print(f"{len(rows)} frames, median mad {med:.2f}, max mad {max(r['mad'] for r in rows):.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
