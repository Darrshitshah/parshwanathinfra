"""Contact strip of any video: labelled frames in a grid, for frame-by-frame checks (joins, ghosting, floor counts).

Run from the project folder (quote the path, it ends with a space):
  ~/.local/bin/uv run --no-project --python 3.12 --with pillow --with numpy --with imageio-ffmpeg python tools/imagegen/hero_strip.py \\
      VIDEO OUT.jpg [--start S] [--end E] [--fps F | --count N] [--cols C] [--width W] [--crop x0,y0,x1,y1] [--offset T]
  * the frames are taken from [start, end) of the video at F frames a second (24 = every frame, 12 = every second frame), or N frames spread
    evenly over the range with --count;
  * --crop takes fractions of the frame (0.5,0,1,0.5 = the top right quarter) so a ghost or a floor count can be read at full size;
  * --offset T is added to the printed time (use the join start of a cut to label strips of a clip with film time).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

FF = imageio_ffmpeg.get_ffmpeg_exe()


def probe(path: Path) -> tuple[float, int, int, float]:
    txt = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", txt)
    size = re.search(r"Video: .*?, (\d{3,5})x(\d{3,5})", txt)
    fps = re.search(r"([\d.]+) fps", txt)
    seconds = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3)) if dur else 0.0
    return seconds, int(size.group(1)), int(size.group(2)), float(fps.group(1)) if fps else 24.0


def decode(path: Path, start: float, end: float, fps: float, width: int, crop: tuple[float, float, float, float] | None) -> list[np.ndarray]:
    seconds, w, h, _ = probe(path)
    vf = []
    if crop:
        x0, y0, x1, y1 = crop
        vf.append(f"crop=iw*{x1 - x0:.6f}:ih*{y1 - y0:.6f}:iw*{x0:.6f}:ih*{y0:.6f}")
    out_w = width
    out_h = round(width * ((h * ((crop[3] - crop[1]) if crop else 1.0)) / (w * ((crop[2] - crop[0]) if crop else 1.0))) / 2) * 2
    vf += [f"fps={fps}", f"scale={out_w}:{out_h}:flags=lanczos"]
    cmd = [FF, "-loglevel", "error", "-ss", f"{start:.4f}", "-t", f"{max(0.0, end - start):.4f}", "-i", str(path), "-an", "-vf", ",".join(vf),
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n, frames = out_w * out_h * 3, []
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        frames.append(np.frombuffer(buf, np.uint8).reshape(out_h, out_w, 3).copy())
    proc.wait()
    return frames


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--fps", type=float, default=None, help="frames a second to take (24 = every frame)")
    ap.add_argument("--count", type=int, default=12, help="frames spread evenly over the range (when --fps is not given)")
    ap.add_argument("--cols", type=int, default=3)
    ap.add_argument("--width", type=int, default=560, help="tile width in pixels")
    ap.add_argument("--crop", default=None, help="x0,y0,x1,y1 as fractions of the frame")
    ap.add_argument("--offset", type=float, default=0.0, help="added to the printed time")
    ap.add_argument("--quality", type=int, default=88)
    args = ap.parse_args(argv)
    path = Path(args.video)
    seconds, _, _, src_fps = probe(path)
    end = min(args.end if args.end is not None else seconds, seconds)
    crop = tuple(float(v) for v in args.crop.split(",")) if args.crop else None
    if args.fps:
        fps = args.fps
    else:
        fps = max(1.0, (args.count - 0.5) / max(0.1, end - args.start))
    frames = decode(path, args.start, end, fps, args.width, crop)
    if not frames:
        print("no frames decoded", file=sys.stderr)
        return 1
    if not args.fps:
        frames = frames[: args.count]
    th, tw = frames[0].shape[:2]
    rows = (len(frames) + args.cols - 1) // args.cols
    sheet = Image.new("RGB", (tw * args.cols, th * rows), (18, 18, 18))
    for i, fr in enumerate(frames):
        t = args.start + i / fps
        im = Image.fromarray(fr)
        d = ImageDraw.Draw(im)
        label = f"t={t + args.offset:.2f}s"
        d.rectangle([0, 0, 8 + 7 * len(label), 16], fill=(0, 0, 0))
        d.text((4, 2), label, fill=(255, 255, 0))
        sheet.paste(im, ((i % args.cols) * tw, (i // args.cols) * th))
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.out, quality=args.quality)
    print(f"{args.out}: {len(frames)} frames {tw}x{th} each, sheet {sheet.size[0]}x{sheet.size[1]}, {Path(args.out).stat().st_size / 1000:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
