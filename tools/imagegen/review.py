"""Review a generated clip: 4 stills in a strip + a 720 px phone preview MP4 (H.264, faststart, under 2 MB).
Usage: python tools/imagegen/review.py <clip-id e.g. dive-A> <out_dir>   (needs --with imageio-ffmpeg)"""
import pathlib
import subprocess
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import imageio_ffmpeg
from PIL import Image
from _lib import GEN

FF = imageio_ffmpeg.get_ffmpeg_exe()


def main(cid, out_dir):
    src = GEN / "video" / f"{cid}.mp4"
    out = pathlib.Path(out_dir); (out / "frames").mkdir(parents=True, exist_ok=True)
    frames = []
    for i, t in enumerate([0.1, 2.7, 5.3, 7.85]):
        f = out / "frames" / f"{cid}-{i}.jpg"
        subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(t), "-i", str(src), "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "3", str(f)], check=True)
        frames.append(Image.open(f))
    w, h = frames[0].size
    sheet = Image.new("RGB", (w * 2, h * 2))
    for i, fr in enumerate(frames):
        sheet.paste(fr, ((i % 2) * w, (i // 2) * h))
    sheet.save(out / "frames" / f"{cid}-strip.jpg", quality=85)
    mp4 = out / f"{cid}.mp4"
    for crf in (24, 26, 28, 30, 32, 34):
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(src), "-an", "-vf", "scale=720:-2", "-c:v", "libx264", "-preset", "slow",
                        "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], check=True)
        if mp4.stat().st_size < 2_000_000:
            break
    print(cid, "preview", mp4.stat().st_size // 1024, "KB crf", crf)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
