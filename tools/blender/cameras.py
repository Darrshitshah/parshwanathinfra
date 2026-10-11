"""Cameras and lighting for the diorama (owner: scene-lead).

One station per S3 chapter (view boxes read from src/content/plan/chapters.ts, the single source of truth) plus an
isometric overview. The camera maths is mirrored in src/features/diorama/stations.ts, driven by the `camera` block of
scene-meta.json, so the web scene and the renders look at the same places.

    tools/.venv-blender/bin/python tools/blender/cameras.py      # adds cameras, writes the camera block of scene-meta.json
"""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from mathutils import Vector

from common import BLEND_PATH, META_PATH, ROOT, Frame, hex_rgba, load_plan

CHAPTERS_TS = ROOT / "src/content/plan/chapters.ts"
CAMERA_CONFIG = {
    "azimuthDeg": 20.0,    # 0 = looking up the plan (north of the image), positive turns the camera to the right
    "elevationDeg": 40.0,
    "hfovDeg": 26.0,
    "targetZ": 5.0,
    "margin": 1.1,
    "aspect": 20 / 11,
}
OVERVIEW_BOX_PX = [10, 240, 1940, 860]  # whole township plus the highway verge


def read_chapter_views() -> list[tuple[str, list[float]]]:
    text = CHAPTERS_TS.read_text()
    found = re.findall(r'\n    id: "([a-z-]+)",\n    title: "[^"]+",\n    body: "(?:[^"\\]|\\.)*",\n    view: \[([^\]]+)\]', text)
    views = [(cid, [float(v) for v in raw.split(",")]) for cid, raw in found]
    if len(views) != 6:
        raise SystemExit(f"expected 6 chapters in chapters.ts, parsed {len(views)}")
    return views


def station_pose(box_px, frame: Frame, cfg=CAMERA_CONFIG):
    """Camera position and target (metres) for a grid view box [x, y, w, h]."""
    x, y, w, h = box_px
    cx, cy = frame.xy((x + w / 2, y + h / 2))
    wm, hm = w * frame.mpp, h * frame.mpp
    az, el = math.radians(cfg["azimuthDeg"]), math.radians(cfg["elevationDeg"])
    extent = wm * abs(math.cos(az)) + hm * abs(math.sin(az))
    dist = extent * cfg["margin"] / (2 * math.tan(math.radians(cfg["hfovDeg"]) / 2))
    target = Vector((cx, cy, cfg["targetZ"]))
    direction = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    return target + direction * dist, target


def look_at(obj, position: Vector, target: Vector) -> None:
    obj.location = position
    direction = target - position
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name: str, box_px, frame: Frame):
    data = bpy.data.cameras.new(name)
    data.sensor_fit = "HORIZONTAL"
    data.angle_x = math.radians(CAMERA_CONFIG["hfovDeg"])
    data.clip_start, data.clip_end = 5.0, 4000.0
    cam = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(cam)
    pos, target = station_pose(box_px, frame)
    look_at(cam, pos, target)
    return cam


def setup_lighting(scene) -> None:
    world = bpy.data.worlds.new("paper") if not scene.world else scene.world
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld")
    visible = nodes.new("ShaderNodeBackground")  # what the camera sees: the paper colour at full strength
    visible.inputs["Color"].default_value = hex_rgba("#f3efe7")
    visible.inputs["Strength"].default_value = 1.0
    ambient = nodes.new("ShaderNodeBackground")  # what lights the clay: a softer sky
    ambient.inputs["Color"].default_value = hex_rgba("#f3f3f0")
    ambient.inputs["Strength"].default_value = 0.85
    path = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(ambient.outputs["Background"], mix.inputs[1])
    links.new(visible.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 2.0
    sun.angle = math.radians(5)
    sun.color = (1.0, 0.985, 0.96)
    sun_obj = bpy.data.objects.new("sun", sun)
    sun_obj.rotation_euler = (math.radians(52), math.radians(8), math.radians(-38))
    scene.collection.objects.link(sun_obj)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


def build_cameras() -> list[dict]:
    plan = load_plan()
    frame = Frame(plan)
    scene = bpy.context.scene
    for obj in [o for o in scene.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(obj, do_unlink=True)
    setup_lighting(scene)
    stations = [{"id": "overview", "view": OVERVIEW_BOX_PX}] + [{"id": cid, "view": v} for cid, v in read_chapter_views()]
    for s in stations:
        add_camera(f"cam-{s['id']}", s["view"], frame)
    scene.camera = bpy.data.objects["cam-overview"]
    return stations


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    stations = build_cameras()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    meta = json.loads(META_PATH.read_text())
    meta["camera"] = {**CAMERA_CONFIG, "stations": stations}
    META_PATH.write_text(json.dumps(meta, indent=1))
    print("cameras:", ", ".join(s["id"] for s in stations))


if __name__ == "__main__":
    main()
