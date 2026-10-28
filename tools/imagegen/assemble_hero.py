"""Assemble the hero film ("Shiv Shiva builds itself") from approved segment takes and encode every web deliverable.

Run from the project folder (quote the path, it ends with a space):
  ~/.local/bin/uv run --no-project --python 3.12 --with pillow --with numpy --with imageio-ffmpeg --with google-cloud-storage \\
      python tools/imagegen/assemble_hero.py tools/imagegen/hero_edit.json [--cut full] [--only master,web,poster,sequence,manifest,preview,upload]
      [--preview-dir DIR]          phone preview (under 6 MB) and a 10-frame contact strip of each cut go to DIR
  python tools/imagegen/assemble_hero.py --selftest

The edit list is JSON (paths relative to the project root):
  {"name": "hero", "fps": 24, "size": [3840, 2160], "master": {"crf": 14}, "title": "...", "alt": "...", "color_match": true,
   "web": {"desktop": {"width": 1920, "mp4": {"mb": 3.0}, "webm": {"mb": 3.0}}, "mobile": {"width": 1280, "mp4": {"mb": 2.0}, "webm": {"crf": 36}}},
   "poster": {"source": "path/to/still.jpg", "max_kb": 195, "width": 1920, "start": true},
   "sequence": {"frames": 120, "width": 1280, "max_mb": 5.8, "dir": "public/sequences/hero"},
   "manifest": "manifest.json",
   "cuts": [{"id": "full", "suffix": "", "poster": true, "sequence": true, "web": {"desktop": {"width": 1920, "mp4": {"mb": 6.0}, "webm": {"mb": 5.5}}},
             "segments": [{"file": "...", "in": 0.0, "out": 8.0, "speed": 1.0, "xfade": 0.5, "style": "dissolve", "label": "Roads"},
                          {"file": "path/to/still.jpg", "in": 0.0, "out": 3.0, "xfade": 1.2, "label": "Township"}]}]}
  * xfade is the crossfade INTO that segment from the previous one (ignored on the first); style "bloom" adds a warm golden haze at the
    middle of the dissolve (use it to hide a layout change). A web file takes {"mb": n} (two-pass to that size) or {"crf": n}.
  * a segment file may be a still (.jpg .png .webp): it is held for out - in seconds. A still is an anchor ("anchor": false to opt out):
    colour matching never changes it, its neighbour moves the whole way to it, so a film can end on the exact approved render.
  * color_match: per-join exposure and white balance normalisation (a gamma per channel at each clip end, split equally between the
    two clips, never more than +/- 12 %), so the cuts do not jump. Crossfades are blended in linear light.
  * poster: hero-poster is the named source still, else the last frame (the finished township); "start": true also writes hero-poster-start
    from the first frame, so a film that starts playing never jumps from its poster. Consecutive segments with one label are one chapter.
Outputs: _source/generated/video/hero/<name><suffix>-master.mp4 (the edit's size, H.264, CRF 14), public/video/hero/<name><suffix>-<variant>.<mp4|webm>,
  public/video/hero/<name>-poster.webp, public/sequences/hero/frame-NNN.webp + manifest.json, public/video/hero/manifest.json.
All video is muted (no audio track). Nothing here calls a model.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
from collections import deque
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterator, Optional, Sequence

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[2]
FF = imageio_ffmpeg.get_ffmpeg_exe()
MASTER_DIR = ROOT / "_source" / "generated" / "video" / "hero"
WEB_DIR = ROOT / "public" / "video" / "hero"
GCS_REVIEW = ("parshwanath-infra-veo", "review/hero/")
STAT_SIZE = (320, 180)
MAX_GAMMA_ADJUST = 0.12
MIN_WINDOW_S = 0.25
BLOOM_RGB = np.array([255.0, 233.0, 196.0])
BLOOM_STRENGTH = 0.38
DEFAULT_WEB = {
    "desktop": {"width": 1920, "mp4": {"mb": 3.0}, "webm": {"mb": 3.0}},
    "mobile": {"width": 1280, "mp4": {"mb": 2.0}, "webm": {"mb": 2.0}},
}
STEPS = ("master", "web", "poster", "sequence", "manifest")
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
STILL_MAX_S = 3600.0


# ---------------------------------------------------------------- data model
@dataclass(frozen=True)
class Segment:
    file: Path
    t_in: float
    t_out: float
    speed: float
    xfade: float
    style: str
    label: str
    anchor: bool = False  # a still that must stay exactly as it is: its neighbours match its colour, never the other way round

    @property
    def seconds(self) -> float:
        return (self.t_out - self.t_in) / self.speed

    @property
    def is_still(self) -> bool:
        return self.file.suffix.lower() in IMAGE_EXT


@dataclass(frozen=True)
class Cut:
    id: str
    suffix: str
    segments: tuple[Segment, ...]
    poster: bool
    sequence: bool
    web: dict


@dataclass(frozen=True)
class Edit:
    name: str
    fps: int
    size: tuple[int, int]
    title: str
    alt: str
    color_match: bool
    cuts: tuple[Cut, ...]
    poster: dict
    sequence: dict
    manifest_name: str = "manifest.json"
    master_crf: int = 14


# ---------------------------------------------------------------- small pure helpers
def smoothstep(x: float) -> float:
    x = min(1.0, max(0.0, x))
    return x * x * (3.0 - 2.0 * x)


def frames_for(seconds: float, fps: int) -> int:
    return int(round(seconds * fps))


def crossfade_weight(j: int, n: int) -> float:
    """Weight of the incoming clip for blended frame j of n (never exactly 0 or 1)."""
    return smoothstep((j + 1) / (n + 1))


def budget_kbps(target_bytes: int, seconds: float, overhead: float = 0.985) -> int:
    return max(40, int(target_bytes * 8 / seconds / 1000 * overhead))


def gamma_to(mean: np.ndarray, target: np.ndarray) -> np.ndarray:
    """Per-channel gamma that maps `mean` onto `target` (0..255 scale). Black and white points never move, so nothing clips."""
    m = np.clip(mean, 8.0, 247.0) / 255.0
    t = np.clip(target, 8.0, 247.0) / 255.0
    return np.clip(np.log(t) / np.log(m), 1.0 - MAX_GAMMA_ADJUST, 1.0 + MAX_GAMMA_ADJUST)


def plan_gammas(stats: Sequence[tuple[np.ndarray, np.ndarray]], anchors: Optional[Sequence[bool]] = None) -> list[tuple[np.ndarray, np.ndarray]]:
    """stats[i] = (head mean, tail mean) of segment i. Returns (head gamma, tail gamma) per segment.
    At each join both clips move to the geometric mean of the two ends, so the correction is shared and nothing drifts along the chain.
    An anchored segment (a still) is never touched: its neighbour moves the whole way to it instead."""
    anchors = list(anchors) if anchors is not None else [False] * len(stats)
    one = np.ones(3)
    out: list[tuple[np.ndarray, np.ndarray]] = []
    for i, (head, tail) in enumerate(stats):
        if anchors[i]:
            out.append((one, one))
            continue
        g_head = one
        g_tail = one
        if i > 0:
            prev_tail = stats[i - 1][1]
            g_head = gamma_to(head, prev_tail if anchors[i - 1] else np.sqrt(prev_tail * head))
        if i + 1 < len(stats):
            next_head = stats[i + 1][0]
            g_tail = gamma_to(tail, next_head if anchors[i + 1] else np.sqrt(tail * next_head))
        out.append((g_head, g_tail))
    return out


def gamma_lut(gamma: np.ndarray) -> np.ndarray:
    x = np.arange(256, dtype=np.float64) / 255.0
    return np.stack([np.round(255.0 * x ** g) for g in gamma], axis=1).astype(np.uint8)


def apply_gamma(frame: np.ndarray, gamma: np.ndarray) -> np.ndarray:
    if np.allclose(gamma, 1.0, atol=2e-3):
        return frame
    lut = gamma_lut(gamma)
    return np.stack([lut[frame[..., c], c] for c in range(3)], axis=-1)


_LIN = (np.arange(256, dtype=np.float32) / 255.0) ** 2.2


def blend(a: np.ndarray, b: np.ndarray, w: float, style: str = "dissolve") -> np.ndarray:
    """Dissolve a into b at weight w in linear light; style 'bloom' adds a warm haze peaking at the middle."""
    lin = _LIN[a] * (1.0 - w) + _LIN[b] * w
    out = np.power(lin, 1.0 / 2.2) * 255.0
    if style == "bloom":
        p = BLOOM_STRENGTH * math.sin(math.pi * w) ** 2
        out = out * (1.0 - p) + BLOOM_RGB[None, None, :] * p
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- ffmpeg plumbing
def run(cmd: Sequence[str]) -> str:
    res = subprocess.run(list(cmd), capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"command failed ({res.returncode}): {' '.join(map(str, cmd[:8]))} ... {res.stderr[-700:]}")
    return res.stderr


def probe(path: Path) -> dict:
    txt = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", txt)
    vid = re.search(r"Video: (\w+).*?, (\d{3,5})x(\d{3,5})", txt)
    fps = re.search(r"([\d.]+) fps", txt)
    tags = re.search(r"Video: [^\n]*?yuv\w*\(([^)]*)\)", txt)
    matrix = "bt709"
    if tags:
        for tok in tags.group(1).split(","):
            if "/" in tok and tok.strip().split("/")[0] in ("smpte170m", "bt470bg", "bt601"):
                matrix = "bt601"
    return {
        "seconds": int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3)) if dur else 0.0,
        "codec": vid.group(1) if vid else "?", "width": int(vid.group(2)) if vid else 0, "height": int(vid.group(3)) if vid else 0,
        "fps": float(fps.group(1)) if fps else 0.0, "tagged_matrix": matrix, "untagged": not (tags and "/" in tags.group(1)),
    }


def source_matrix(path: Path) -> str:
    """Matrix the clip was really encoded with. Measured 2026-10-17: Veo clips (untagged) and Omni clips (tagged smpte170m) both decode
    closest to their keyframes with BT.601, while a browser would show the untagged Veo files as BT.709 (a slight orange shift)."""
    return "bt601"


def read_frames(seg: Segment, size: tuple[int, int], fps: int, matrix: str, flags: str = "lanczos") -> Iterator[np.ndarray]:
    w, h = size
    vf = f"setpts=PTS/{seg.speed:.6f},fps={fps},scale={w}:{h}:flags={flags}:in_color_matrix={matrix},format=rgb24"
    src_in = ["-loop", "1", "-framerate", str(fps)] if seg.is_still else ["-ss", f"{seg.t_in:.3f}"]  # a still is looped for its length
    cmd = [FF, "-loglevel", "error", *src_in, "-t", f"{seg.t_out - seg.t_in:.3f}", "-i", str(seg.file),
           "-an", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = w * h * 3
    try:
        while True:
            buf = proc.stdout.read(n)
            if len(buf) < n:
                break
            yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    finally:
        proc.stdout.close()
        proc.wait()


class Writer:
    """Pipe RGB frames into one H.264 master (BT.709, limited range, no audio)."""

    def __init__(self, dest: Path, size: tuple[int, int], fps: int, crf: int = 14) -> None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        w, h = size
        cmd = [FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
               "-vf", "scale=flags=accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p",
               "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "high", "-an",
               "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
               "-movflags", "+faststart", str(dest)]
        self._err = tempfile.TemporaryFile()
        self._proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=self._err)
        self.count = 0

    def write(self, frame: np.ndarray) -> None:
        self._proc.stdin.write(np.ascontiguousarray(frame).tobytes())
        self.count += 1

    def close(self) -> None:
        self._proc.stdin.close()
        rc = self._proc.wait()
        if rc != 0:
            self._err.seek(0)
            raise RuntimeError(f"master encode failed: {self._err.read().decode()[-600:]}")
        self._err.close()


# ---------------------------------------------------------------- edit list
def load_edit(path: Path) -> Edit:
    raw = json.loads(path.read_text())
    fps = int(raw.get("fps", 24))
    cuts = []
    for c in raw["cuts"]:
        segs = []
        for i, s in enumerate(c["segments"]):
            f = (ROOT / s["file"]).resolve() if not Path(s["file"]).is_absolute() else Path(s["file"])
            if not f.exists():
                raise FileNotFoundError(f"segment file missing: {f}")
            still = f.suffix.lower() in IMAGE_EXT
            dur = STILL_MAX_S if still else probe(f)["seconds"]  # a still can be held for as long as the edit asks
            t_in, t_out = float(s.get("in", 0.0)), float(s.get("out", 3.0 if still else dur))
            speed = float(s.get("speed", 1.0))
            if not (0 <= t_in < t_out <= dur + 0.05) or not (0.25 <= speed <= 4.0):
                raise ValueError(f"{c['id']} segment {i} {f.name}: bad trim/speed in={t_in} out={t_out} dur={dur} speed={speed}")
            style = s.get("style", "dissolve")
            if style not in ("dissolve", "bloom"):
                raise ValueError(f"unknown style {style}")
            segs.append(Segment(f, t_in, min(t_out, dur), speed, float(s.get("xfade", 0.5)) if i else 0.0, style, s.get("label", f.stem),
                                bool(s.get("anchor", still))))
        for i in range(1, len(segs)):
            need = frames_for(segs[i].xfade, fps) + (frames_for(segs[i + 1].xfade, fps) if i + 1 < len(segs) else 0)
            if frames_for(segs[i].seconds, fps) <= need:
                raise ValueError(f"{c['id']} segment {i}: shorter than its two crossfades")
        cuts.append(Cut(c["id"], c.get("suffix", ""), tuple(segs), bool(c.get("poster", False)), bool(c.get("sequence", False)),
                        {**DEFAULT_WEB, **raw.get("web", {}), **c.get("web", {})}))
    size = raw.get("size", [1920, 1080])
    return Edit(raw.get("name", "hero"), fps, (int(size[0]), int(size[1])), raw.get("title", ""), raw.get("alt", ""),
                bool(raw.get("color_match", True)), tuple(cuts), raw.get("poster", {}), raw.get("sequence", {}), raw.get("manifest", "manifest.json"),
                int(raw.get("master", {}).get("crf", 14)))


# ---------------------------------------------------------------- master
def window_mean(seg: Segment, src_start: float, src_len: float, matrix: str) -> np.ndarray:
    sub = replace(seg, t_in=max(0.0, src_start), t_out=src_start + src_len)
    acc, n = np.zeros(3), 0
    for fr in read_frames(sub, STAT_SIZE, 8, matrix, flags="area"):
        acc += fr.reshape(-1, 3).mean(axis=0)
        n += 1
    if n == 0:
        raise RuntimeError(f"no frames decoded for statistics of {seg.file.name}")
    return acc / n


def collect_stats(segs: Sequence[Segment], matrices: Sequence[str]) -> list[tuple[np.ndarray, np.ndarray]]:
    out = []
    for i, seg in enumerate(segs):
        w_head = max(seg.xfade if i else 0.5, MIN_WINDOW_S)
        w_tail = max(segs[i + 1].xfade if i + 1 < len(segs) else 0.5, MIN_WINDOW_S)
        head = window_mean(seg, seg.t_in, w_head * seg.speed, matrices[i])
        tail = window_mean(seg, seg.t_out - w_tail * seg.speed, w_tail * seg.speed, matrices[i])
        out.append((head, tail))
    return out


def gamma_at(k: int, total: int, g_head: np.ndarray, g_tail: np.ndarray) -> np.ndarray:
    return g_head + (g_tail - g_head) * smoothstep(k / max(1, total - 1))


def render_cut(edit: Edit, cut: Cut, dest: Path) -> dict:
    segs = cut.segments
    matrices = [source_matrix(s.file) for s in segs]
    gam = plan_gammas(collect_stats(segs, matrices), [sg.anchor for sg in segs]) if edit.color_match else [(np.ones(3), np.ones(3))] * len(segs)
    for i, (g_head, g_tail) in enumerate(gam):
        print(f"  [{cut.id}] seg{i + 1} {segs[i].label}: gamma head {np.round(g_head, 3)} tail {np.round(g_tail, 3)}")
    writer = Writer(dest, edit.size, edit.fps, edit.master_crf)
    prev_tail: list[np.ndarray] = []
    for i, seg in enumerate(segs):
        n_in = frames_for(seg.xfade, edit.fps) if i else 0
        n_out = frames_for(segs[i + 1].xfade, edit.fps) if i + 1 < len(segs) else 0
        total = frames_for(seg.seconds, edit.fps)
        head: list[np.ndarray] = []
        tail: deque[np.ndarray] = deque()
        for k, raw in enumerate(read_frames(seg, edit.size, edit.fps, matrices[i])):
            frame = apply_gamma(raw, gamma_at(k, total, *gam[i]))
            if k < n_in:
                head.append(frame)
                if len(head) == n_in:
                    for j, (a, b) in enumerate(zip(prev_tail, head)):
                        writer.write(blend(a, b, crossfade_weight(j, n_in), seg.style))
                continue
            tail.append(frame)
            if len(tail) > n_out:
                writer.write(tail.popleft())
        prev_tail = list(tail)
        print(f"  [{cut.id}] seg{i + 1} done, frames written so far {writer.count}")
    writer.close()
    return {"frames": writer.count, "seconds": writer.count / edit.fps}


# ---------------------------------------------------------------- web encodes
def x264_args(dest: Path, vf: str, kbps: Optional[int], crf: Optional[int], pass_no: int, log: Path) -> list[str]:
    cmd = [FF, "-y", "-loglevel", "error", "-i", str(MASTER_TMP[0]), "-an", "-vf", vf, "-c:v", "libx264", "-preset", "slower",
           "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", "120", "-keyint_min", "24",
           "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1:rc-lookahead=60",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]
    if kbps is not None:
        cmd += ["-b:v", f"{kbps}k", "-pass", str(pass_no), "-passlogfile", str(log)]
    else:
        cmd += ["-crf", str(crf)]
    return cmd + (["-f", "null", "/dev/null"] if pass_no == 1 else ["-movflags", "+faststart", str(dest)])


MASTER_TMP: list[Path] = [Path()]


def web_filter(master: Path, width: int, spec: dict) -> str:
    """Scale to the web width, after an optional pre-filter from the spec ("pre": e.g. "hqdn3d=1.5:1.2:4:4" takes the generator's grain out
    before the encode, so the bits go to the picture instead of the noise)."""
    scale = f"scale={width}:-2:flags=lanczos" if width != probe(master)["width"] else "null"
    return f"{spec['pre']},{scale}" if spec.get("pre") else scale


def encode_mp4(master: Path, dest: Path, width: int, spec: dict, seconds: float) -> int:
    MASTER_TMP[0] = master
    vf = web_filter(master, width, spec)
    with tempfile.TemporaryDirectory() as td:
        log = Path(td) / "x264"
        if "crf" in spec:
            run(x264_args(dest, vf, None, int(spec["crf"]), 2, log))
            return dest.stat().st_size
        target = int(spec["mb"] * 1_000_000)
        kbps = budget_kbps(target, seconds)
        for _ in range(3):
            run(x264_args(dest, vf, kbps, None, 1, log))
            run(x264_args(dest, vf, kbps, None, 2, log))
            size = dest.stat().st_size
            if size <= target:
                return size
            kbps = int(kbps * target / size * 0.97)
    return dest.stat().st_size


def vp9_args(master: Path, dest: Path, vf: str, kbps: Optional[int], crf: Optional[int], pass_no: int, log: Path) -> list[str]:
    cmd = [FF, "-y", "-loglevel", "error", "-i", str(master), "-an", "-vf", vf, "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-row-mt", "1",
           "-tile-columns", "2", "-g", "120", "-auto-alt-ref", "1", "-lag-in-frames", "25", "-frame-parallel", "0", "-deadline", "good",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]
    if kbps is not None:
        cmd += ["-b:v", f"{kbps}k", "-maxrate", f"{int(kbps * 1.5)}k", "-pass", str(pass_no), "-passlogfile", str(log),
                "-cpu-used", "4" if pass_no == 1 else "1"]
    else:
        cmd += ["-b:v", "0", "-crf", str(crf), "-cpu-used", "1"]
    return cmd + (["-f", "null", "/dev/null"] if pass_no == 1 else [str(dest)])


def encode_webm(master: Path, dest: Path, width: int, spec: dict, seconds: float) -> int:
    vf = web_filter(master, width, spec)
    with tempfile.TemporaryDirectory() as td:
        log = Path(td) / "vp9"
        if "crf" in spec:
            run(vp9_args(master, dest, vf, None, int(spec["crf"]), 2, log))
            return dest.stat().st_size
        target = int(spec["mb"] * 1_000_000)
        kbps = budget_kbps(target, seconds, 0.97)
        for _ in range(3):
            run(vp9_args(master, dest, vf, kbps, None, 1, log))
            run(vp9_args(master, dest, vf, kbps, None, 2, log))
            size = dest.stat().st_size
            if size <= target:
                return size
            kbps = int(kbps * target / size * 0.96)
    return dest.stat().st_size


def quality(master: Path, encoded: Path) -> dict:
    """SSIM (and VMAF when the build has it) of an encode against the master, both at the encode's size."""
    info = probe(encoded)
    w, h = info["width"], info["height"]
    pre = f"scale={w}:{h}:flags=lanczos,settb=AVTB,setpts=PTS-STARTPTS"
    res: dict = {}
    txt = subprocess.run([FF, "-hide_banner", "-i", str(encoded), "-i", str(master), "-lavfi",
                          f"[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]{pre}[b];[a][b]ssim", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"All:([\d.]+)", txt)
    res["ssim"] = float(m.group(1)) if m else None
    txt = subprocess.run([FF, "-hide_banner", "-i", str(encoded), "-i", str(master), "-lavfi",
                          f"[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]{pre}[b];[a][b]libvmaf=n_subsample=6:n_threads=8", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.search(r"VMAF score: ([\d.]+)", txt)
    res["vmaf"] = float(m.group(1)) if m else None
    return res


def encode_web(edit: Edit, cut: Cut, master: Path) -> dict:
    seconds = probe(master)["seconds"]
    out: dict = {}
    base = f"{edit.name}{cut.suffix}"
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    for variant, cfg in cut.web.items():
        width = int(cfg["width"])
        height = int(round(width * edit.size[1] / edit.size[0] / 2) * 2)
        out[variant] = {}
        for ext, fn in (("mp4", encode_mp4), ("webm", encode_webm)):
            dest = WEB_DIR / f"{base}-{variant}.{ext}"
            size = fn(master, dest, width, cfg[ext], seconds)
            q = quality(master, dest)
            out[variant][ext] = {"bytes": size, "width": width, "height": height, **q}
            print(f"  [{cut.id}] {dest.name}: {size / 1e6:.2f} MB ({size * 8 / seconds / 1000:.0f} kbps) ssim {q['ssim']} vmaf {q['vmaf']}")
    return out


# ---------------------------------------------------------------- poster, sequence, preview
def last_frame(master: Path, width: int, fps: int) -> Image.Image:
    seconds = probe(master)["seconds"]
    t = max(0.0, seconds - 1.5 / fps)
    raw = subprocess.run([FF, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(master), "-frames:v", "1", "-vf", f"scale={width}:-2:flags=lanczos",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    import io
    return Image.open(io.BytesIO(raw)).convert("RGB")


def under_budget(im: Image.Image, dest: Path, max_bytes: int, fmt: str, start_q: int) -> int:
    """Save im as fmt, lowering the quality from start_q until the file fits; returns the quality used."""
    extra = {"method": 6} if fmt == "WEBP" else {"speed": 5}
    q = start_q
    while q > 10:
        im.save(dest, fmt, quality=q, **extra)
        if dest.stat().st_size <= max_bytes:
            return q
        q -= 3
    return q


def first_frame(master: Path, width: int) -> Image.Image:
    raw = subprocess.run([FF, "-loglevel", "error", "-i", str(master), "-frames:v", "1", "-vf", f"scale={width}:-2:flags=lanczos",
                          "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    import io
    return Image.open(io.BytesIO(raw)).convert("RGB")


def poster_image(src: Optional[str], master: Path, width: int, fps: int, which: str = "last") -> Image.Image:
    """The poster still: a named image file, else the first or the last frame of the master."""
    if src:
        im = Image.open(ROOT / src).convert("RGB")
        return im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
    return first_frame(master, width) if which == "first" else last_frame(master, width, fps)


def poster_files(stem: str) -> dict:
    """Describe the poster files already on disk for one stem (WebP, plus the AVIF alternative when present)."""
    webp, avif = WEB_DIR / f"{stem}.webp", WEB_DIR / f"{stem}.avif"
    if not webp.exists():
        return {}
    im = Image.open(webp)
    out = {"src": f"/video/hero/{webp.name}", "width": im.width, "height": im.height, "bytes": webp.stat().st_size}
    if avif.exists():
        ia = Image.open(avif)
        out["avif"] = {"src": f"/video/hero/{avif.name}", "width": ia.width, "height": ia.height, "bytes": avif.stat().st_size}
    return out


def poster_info(edit: Edit) -> dict:
    """The finished-township poster, plus the poster of the first frame under "start" when it was built."""
    out = poster_files(f"{edit.name}-poster")
    start = poster_files(f"{edit.name}-poster-start")
    if out and start:
        out["start"] = start
    return out


def write_poster(edit: Edit, master: Path, stem: str, which: str) -> dict:
    cfg = edit.poster
    max_bytes = int(cfg.get("max_kb", 195) * 1000)
    full_w = int(cfg.get("width", 1920))
    src = cfg.get("source") if which == "last" else None
    dest = WEB_DIR / f"{stem}.webp"
    for width in (full_w, 1600, 1440):  # the widest size that keeps a decent WebP quality inside the budget
        im = poster_image(src, master, width, edit.fps, which)
        q = under_budget(im, dest, max_bytes, "WEBP", 92)
        if q >= 55:
            break
    print(f"  poster {dest.name}: {im.size}, quality {q}, {dest.stat().st_size / 1000:.0f} KB")
    if cfg.get("avif", True):
        avif = dest.with_suffix(".avif")
        qa = under_budget(poster_image(src, master, full_w, edit.fps, which), avif, max_bytes, "AVIF", 80)
        print(f"  poster {avif.name}: {full_w} wide, quality {qa}, {avif.stat().st_size / 1000:.0f} KB")
    return {"quality": q}


def make_poster(edit: Edit, master: Path) -> dict:
    """hero-poster: the last frame (or the named source still), the finished township, for reduced motion and the end of the film.
    hero-poster-start (when poster.start is true): the first frame, so a video that starts playing never jumps from its poster."""
    q = write_poster(edit, master, f"{edit.name}-poster", "last")["quality"]
    if edit.poster.get("start"):
        write_poster(edit, master, f"{edit.name}-poster-start", "first")
    return {**poster_info(edit), "quality": q}


def decode_all(master: Path, width: int, indices: set[int]) -> dict[int, Image.Image]:
    info = probe(master)
    h = round(width * info["height"] / info["width"] / 2) * 2
    cmd = [FF, "-loglevel", "error", "-i", str(master), "-vf", f"scale={width}:{h}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n, got, k = width * h * 3, {}, 0
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        if k in indices:
            got[k] = Image.frombuffer("RGB", (width, h), buf, "raw", "RGB", 0, 1).copy()
        k += 1
    proc.wait()
    got["total"] = k  # type: ignore[index]
    return got


def sequence_dir(edit: Edit) -> Path:
    return ROOT / edit.sequence.get("dir", "public/sequences/hero")


SEQ_BLURS = (0.0, 0.5, 0.8, 1.1, 1.5)  # lightest pre-blur that lets the set reach a decent WebP quality inside the budget
SEQ_MIN_Q = 45


def _webp_bytes(im: Image.Image, q: int, method: int = 4) -> bytes:
    import io
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=method)
    return buf.getvalue()


def blurred(im: Image.Image, radius: float) -> Image.Image:
    return im if radius <= 0 else im.filter(ImageFilter.GaussianBlur(radius))


def fit_sequence(frames: dict, idx: Sequence[int], max_bytes: int) -> tuple[float, int]:
    """Lightest blur and highest WebP quality whose whole set fits the budget (estimated from every third frame)."""
    sample, best = list(idx[::3]), None
    for radius in SEQ_BLURS:
        imgs = [blurred(frames[i], radius) for i in sample]
        lo, hi, best = 10, 90, None
        while lo <= hi:
            q = (lo + hi) // 2
            if 3 * sum(len(_webp_bytes(im, q)) for im in imgs) <= max_bytes * 0.97:
                best, lo = q, q + 1
            else:
                hi = q - 1
        if best is not None and best >= SEQ_MIN_Q:
            return radius, best
    return SEQ_BLURS[-1], best or 10


def make_sequence(edit: Edit, master: Path) -> dict:
    cfg = edit.sequence
    seq_dir = sequence_dir(edit)
    url_dir = "/" + seq_dir.relative_to(ROOT / "public").as_posix()
    count, width, max_bytes = int(cfg.get("frames", 120)), int(cfg.get("width", 1280)), int(cfg.get("max_mb", 5.8) * 1_000_000)
    info = probe(master)
    total = int(round(info["seconds"] * edit.fps))
    idx = [round(k * (total - 1) / (count - 1)) for k in range(count)]
    frames = decode_all(master, width, set(idx))
    radius, q = fit_sequence(frames, idx, max_bytes)
    seq_dir.mkdir(parents=True, exist_ok=True)
    while True:
        sizes = []
        for k, i in enumerate(idx):
            path = seq_dir / f"frame-{k + 1:03d}.webp"
            blurred(frames[i], radius).save(path, "WEBP", quality=q, method=6)
            sizes.append(path.stat().st_size)
        if sum(sizes) <= max_bytes or q <= 10:
            break
        q -= 2
    im = frames[idx[0]]
    manifest = {"frames": count, "pattern": url_dir + "/frame-{n:03d}.webp", "first": 1, "width": im.width, "height": im.height,
                "format": "webp", "quality": q, "preBlur": radius, "totalBytes": sum(sizes), "durationSeconds": round(info["seconds"], 3),
                "fps": edit.fps, "artistImpression": True, "alt": edit.alt}
    (seq_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"  sequence {count} frames {im.size} quality {q} blur {radius}: {sum(sizes) / 1e6:.2f} MB")
    return manifest


def make_preview(master: Path, out_dir: Path, name: str, max_bytes: int = 6_000_000) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    mp4 = out_dir / f"{name}-phone.mp4"
    for crf in (24, 26, 28, 30, 32, 34, 36):
        run([FF, "-y", "-loglevel", "error", "-i", str(master), "-an", "-vf", "scale=720:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow",
             "-crf", str(crf), "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
             "-movflags", "+faststart", str(mp4)])  # tagged, so a phone does not read a 405 px tall file as BT.601
        if mp4.stat().st_size < max_bytes:
            break
    seconds = probe(master)["seconds"]
    tiles = []
    for i in range(10):
        t = 0.05 + (seconds - 0.13) * i / 9
        raw = subprocess.run([FF, "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(master), "-frames:v", "1", "-vf", "scale=512:-2", "-f", "image2pipe",
                              "-vcodec", "png", "-"], capture_output=True).stdout
        import io
        tiles.append((t, Image.open(io.BytesIO(raw)).convert("RGB")))
    from PIL import ImageDraw
    tw, th = tiles[0][1].size
    sheet = Image.new("RGB", (tw * 2, th * 5), (20, 20, 20))
    for i, (t, im) in enumerate(tiles):
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 70, 18], fill=(0, 0, 0))
        d.text((4, 3), f"t={t:.1f}s", fill=(255, 255, 0))
        sheet.paste(im, ((i % 2) * tw, (i // 2) * th))
    sheet.save(out_dir / f"{name}-contact.jpg", quality=86)
    print(f"  preview {mp4.name}: {mp4.stat().st_size / 1e6:.2f} MB; contact strip {name}-contact.jpg")


# ---------------------------------------------------------------- manifest and upload
def chapters(edit: Edit, cut: Cut) -> list[dict]:
    """One chapter per label: consecutive segments that share a label (a take cut in two pieces, a held still) read as one chapter."""
    out, t = [], 0.0
    for i, seg in enumerate(cut.segments):
        start = t - (seg.xfade if i else 0.0)
        end = start + seg.seconds
        if out and out[-1]["label"] == seg.label:
            out[-1]["end"] = round(end, 3)
        else:
            out.append({"label": seg.label, "start": round(max(0.0, start), 3), "end": round(end, 3)})
        t = end
    return out


def write_manifest(edit: Edit, cuts: Sequence[Cut], poster: dict, built: dict) -> None:
    seq_dir = sequence_dir(edit)
    seq_url = "/" + seq_dir.relative_to(ROOT / "public").as_posix() + "/manifest.json"
    doc = {"title": edit.title, "alt": edit.alt, "artistImpression": True, "fps": edit.fps, "aspect": "16:9", "muted": True,
           "poster": poster or None, "sequence": seq_url if (seq_dir / "manifest.json").exists() else None, "cuts": {}}
    for cut in cuts:
        files: dict = {}
        for variant in cut.web:
            files[variant] = {}
            for ext in ("mp4", "webm"):
                p = WEB_DIR / f"{edit.name}{cut.suffix}-{variant}.{ext}"
                if p.exists():
                    info = probe(p)
                    files[variant][ext] = {"src": f"/video/hero/{p.name}", "bytes": p.stat().st_size, "width": info["width"], "height": info["height"],
                                           "durationSeconds": round(info["seconds"], 3), "codec": "h264" if ext == "mp4" else "vp9",
                                           **{k: v for k, v in built.get(cut.id, {}).get(variant, {}).get(ext, {}).items() if k in ("ssim", "vmaf")}}
        master = MASTER_DIR / f"{edit.name}{cut.suffix}-master.mp4"
        doc["cuts"][cut.id] = {"durationSeconds": round(probe(master)["seconds"], 3) if master.exists() else None, "chapters": chapters(edit, cut), "files": files}
    dest = WEB_DIR / edit.manifest_name
    dest.write_text(json.dumps(doc, indent=2) + "\n")
    print("  manifest ->", dest)


def upload(paths: Sequence[Path]) -> None:
    from google.cloud import storage
    bucket = storage.Client(project="my-jev-autonomous-agent").bucket(GCS_REVIEW[0])
    for p in paths:
        if p.exists():
            bucket.blob(GCS_REVIEW[1] + p.name).upload_from_filename(str(p))
            print("  uploaded", p.name)


# ---------------------------------------------------------------- self test
def selftest() -> None:
    assert frames_for(0.5, 24) == 12 and abs(smoothstep(0.5) - 0.5) < 1e-9 and smoothstep(-1) == 0.0 and smoothstep(2) == 1.0
    ws = [crossfade_weight(j, 12) for j in range(12)]
    assert all(0 < a < b < 1 for a, b in zip(ws, ws[1:])) and 0 < ws[0] < 0.05 and 0.95 < ws[-1] < 1
    assert 2300 <= budget_kbps(3_000_000, 10.0) <= 2400
    g = gamma_to(np.array([100.0, 100, 100]), np.array([110.0, 100, 90]))
    assert g[0] < 1 < g[2] and abs(g[1] - 1) < 1e-9 and np.all(np.abs(g - 1) <= MAX_GAMMA_ADJUST + 1e-9)
    stats = [(np.array([100.0, 100, 100]), np.array([110.0, 110, 110])), (np.array([100.0, 100, 100]), np.array([100.0, 100, 100]))]
    plan = plan_gammas(stats)
    assert np.allclose(plan[0][0], 1) and np.allclose(plan[1][1], 1)
    mid = np.sqrt(110.0 * 100.0)  # both ends of the join meet at the geometric mean
    assert abs(255 * (110 / 255) ** plan[0][1][0] - mid) < 0.5 and abs(255 * (100 / 255) ** plan[1][0][0] - mid) < 0.5
    anch = plan_gammas(stats, [False, True])  # a still after the first clip: the clip moves the whole way, the still never changes
    assert np.allclose(anch[1][0], 1) and np.allclose(anch[1][1], 1)
    assert abs(255 * (110 / 255) ** anch[0][1][0] - 100.0) < 0.5
    flat = np.full((4, 4, 3), 120, np.uint8)
    assert apply_gamma(flat, np.ones(3)) is flat and apply_gamma(flat, np.array([0.9, 1.0, 1.1]))[0, 0, 0] > 120
    a, b = np.full((2, 2, 3), 0, np.uint8), np.full((2, 2, 3), 255, np.uint8)
    assert blend(a, b, 0.0)[0, 0, 0] == 0 and blend(a, b, 1.0)[0, 0, 0] == 255 and blend(a, b, 0.5, "bloom")[0, 0, 0] > blend(a, b, 0.5)[0, 0, 0] - 1
    with tempfile.TemporaryDirectory() as td:
        td_p = Path(td)
        for n, hue in (("a", 0), ("b", 18), ("c", -18)):
            run([FF, "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=24:duration=3", "-vf", f"hue=h={hue}:s=1,format=yuv420p",
                 "-c:v", "libx264", str(td_p / f"{n}.mp4")])
        edit = Edit("t", 24, (320, 180), "", "", True, (), {}, {})
        segs = tuple(Segment(td_p / f"{n}.mp4", 0.0, 3.0, 1.0, 0.5 if i else 0.0, "bloom" if i == 2 else "dissolve", n) for i, n in enumerate("abc"))
        cut = Cut("t", "", segs, False, False, {})
        out = td_p / "m.mp4"
        res = render_cut(edit, cut, out)
        want = sum(frames_for(s.seconds, 24) for s in segs) - 2 * 12
        assert res["frames"] == want and abs(probe(out)["seconds"] - want / 24) < 0.1, (res, want)
        assert probe(out)["width"] == 320 and probe(out)["codec"] == "h264"
        # a still held at the end: its length counts, it is an anchor, and the last frame is the still itself
        still = td_p / "end.png"
        Image.new("RGB", (64, 36), (200, 120, 40)).save(still)
        segs2 = segs[:2] + (Segment(still, 0.0, 2.0, 1.0, 0.5, "dissolve", "b", True),)
        cut2 = Cut("t2", "", segs2, False, False, {})
        out2 = td_p / "m2.mp4"
        res2 = render_cut(edit, cut2, out2)
        want2 = sum(frames_for(s.seconds, 24) for s in segs2) - 2 * 12
        assert res2["frames"] == want2, (res2, want2)
        px = np.frombuffer(subprocess.run([FF, "-loglevel", "error", "-sseof", "-0.1", "-i", str(out2), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                          capture_output=True).stdout, np.uint8).reshape(180, 320, 3)[90, 160]
        assert abs(int(px[0]) - 200) < 14 and abs(int(px[2]) - 40) < 14, px  # the held still, within H.264 and BT.709 rounding
        labelled = tuple(replace(sg, label=lb) for sg, lb in zip(segs2, ("x", "y", "y")))
        assert [c["label"] for c in chapters(edit, Cut("t3", "", labelled, False, False, {}))] == ["x", "y"]
    print("selftest ok")


# ---------------------------------------------------------------- main
def main(argv: Optional[Sequence[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("edit", nargs="?", help="edit list JSON")
    ap.add_argument("--cut", help="only this cut id")
    ap.add_argument("--only", default=",".join(STEPS), help="comma list of: " + ",".join(STEPS + ("preview", "upload")))
    ap.add_argument("--preview-dir", help="write a phone preview (under 6 MB) and a 10-frame contact strip per cut here")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args(argv)
    if args.selftest:
        selftest()
        return 0
    if not args.edit:
        ap.error("edit list required")
    steps = set(args.only.split(","))
    edit = load_edit(Path(args.edit))
    cuts = [c for c in edit.cuts if not args.cut or c.id == args.cut]
    built: dict = {}
    poster: dict = {}
    for cut in cuts:
        base = f"{edit.name}{cut.suffix}"
        master = MASTER_DIR / f"{base}-master.mp4"
        print(f"== cut {cut.id}: {len(cut.segments)} segments -> {base}")
        if "master" in steps:
            r = render_cut(edit, cut, master)
            print(f"  master {master.name}: {r['seconds']:.2f} s, {master.stat().st_size / 1e6:.1f} MB")
        if not master.exists():
            raise SystemExit(f"no master for cut {cut.id}: run the master step first")
        if "web" in steps:
            built[cut.id] = encode_web(edit, cut, master)
        if "poster" in steps and cut.poster:
            poster = make_poster(edit, master)
        if "sequence" in steps and cut.sequence:
            make_sequence(edit, master)
        if args.preview_dir:
            make_preview(master, Path(args.preview_dir), base)
        if "upload" in steps:
            upload([master] + sorted(WEB_DIR.glob(f"{base}-*")))
    if "manifest" in steps:
        write_manifest(edit, cuts, poster or poster_info(edit), built)
    return 0


if __name__ == "__main__":
    sys.exit(main())
