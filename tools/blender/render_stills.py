"""Render stills and the scroll sequence from the diorama .blend (owner: scene-lead).

    tools/.venv-blender/bin/python tools/blender/render_stills.py stills            # one still per camera, public/3d/stills/*.png
    tools/.venv-blender/bin/python tools/blender/render_stills.py sequence --frames 60   # fly-through frames
    options: --engine EEVEE|CYCLES --samples N --only <station id> --width W

PNGs go to the scratch dir given by --out (default _source/blender/render) and are converted to WebP by `webp.py`.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from mathutils import Quaternion, Vector

import json

from cameras import CAMERA_CONFIG, look_at
from common import BLEND_PATH, META_PATH, ROOT, Frame, load_plan


def configure(width: int, engine: str, samples: int) -> None:
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = round(width / CAMERA_CONFIG["aspect"])
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    if engine == "CYCLES":
        scene.render.engine = "CYCLES"
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
        scene.cycles.device = "CPU"
        # diffuse bounces give the clay its soft occlusion
        scene.cycles.max_bounces = 4
    else:
        names = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
        scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in names else "BLENDER_EEVEE_NEXT"
        ee = scene.eevee
        ee.taa_render_samples = samples
        for attr, val in (("use_gtao", True), ("gtao_distance", 6.0), ("use_shadows", True), ("use_raytracing", False)):
            if hasattr(ee, attr):
                setattr(ee, attr, val)


def render_to(path: Path) -> None:
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def smoothstep(t: float) -> float:
    return t * t * (3 - 2 * t)


def station_cameras():
    meta = json.loads(META_PATH.read_text())
    ids = [s["id"] for s in meta["camera"]["stations"]]
    return [bpy.data.objects[f"cam-{i}"] for i in ids], ids


def sequence_pose(cams, t: float):
    """Position along the chain of stations with a hold at each; yaw/pitch are kept by lerping position and target."""
    n = len(cams) - 1
    seg = min(int(t * n), n - 1)
    local = t * n - seg
    # 25% hold at each end of a segment, eased travel in between
    k = smoothstep(min(1.0, max(0.0, (local - 0.2) / 0.6)))
    a, b = cams[seg], cams[seg + 1]
    pa, pb = a.location, b.location
    ta = pa + a.matrix_world.to_quaternion() @ Vector((0, 0, -1)) * 600
    tb = pb + b.matrix_world.to_quaternion() @ Vector((0, 0, -1)) * 600
    return pa.lerp(pb, k), ta.lerp(tb, k)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "sequence"])
    ap.add_argument("--engine", default="EEVEE")
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--width", type=int, default=0)
    ap.add_argument("--frames", type=int, default=60)
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default=str(ROOT / "_source/blender/render"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    cams, ids = station_cameras()
    if args.mode == "stills":
        configure(args.width or 1920, args.engine, args.samples)
        for cam, cid in zip(cams, ids):
            if args.only and cid != args.only:
                continue
            bpy.context.scene.camera = cam
            render_to(out / f"{cid}.png")
            print("still", cid)
    else:
        configure(args.width or 1280, args.engine, args.samples)
        rig = bpy.data.objects.new("rig", cams[0].data)
        bpy.context.scene.collection.objects.link(rig)
        bpy.context.scene.camera = rig
        for i in range(args.frames):
            pos, target = sequence_pose(cams, i / (args.frames - 1))
            look_at(rig, pos, target)
            render_to(out / f"frame-{i + 1:03d}.png")
            print("frame", i + 1, flush=True)


if __name__ == "__main__":
    main()
