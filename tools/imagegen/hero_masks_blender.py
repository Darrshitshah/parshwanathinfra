"""Pixel-exact masks from the hero camera for compositing the aligned hero keyframes (owner: hero lead A).

    tools/.venv-blender/bin/python tools/imagegen/hero_masks_blender.py [--out DIR] [--width 3840]

Rebuilds the construction-stage scene exactly as tools/blender/render_stages.py --detail does (imported, not modified), then renders
flat white-on-black masks (Workbench, object colour, 16x AA) at 16:9:
  mask-site.png    the site boundary slab (stage-1 graded site, roads inside the boundary included)
  mask-b4.png      stage-4 RC frames (hd4-*), the frames of stage-4-floors.png
  mask-b5.png      stage-5 buildings, amenities, trees, cars, piers (everything stage-5-floors shows above the ground slab)
Every other object is rendered black so it still occludes. Same camera and frame as the clay stages (hero_camera.json).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BLENDER_DIR = Path(__file__).resolve().parents[1] / "blender"
sys.path.insert(0, str(BLENDER_DIR))

import bpy  # noqa: E402

import render_stages as rs  # noqa: E402
from common import BLEND_PATH, Frame, load_plan  # noqa: E402

GROUND_LIKE = ("land", "graded-base", "graded-site", "ground-base", "ground-site", "survey-lines", "survey-pegs",
               "plinths", "half-built", "road-cutter")


def build(detail=True):
    plan = load_plan()
    frame = Frame(plan)
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    scene = bpy.context.scene
    rs.recolour()
    mats = {m.name: m for m in bpy.data.materials}
    col = bpy.data.collections.new("Stages")
    scene.collection.children.link(col)
    rs.land_plane(frame, col)
    rs.survey_lines(plan, frame, col, mats)
    rs.flat_ground(plan, frame, mats, col)
    rs.plinths(plan, frame, mats, col)
    rs.half_built(plan, frame, mats, col)
    replaced = rs.detail_objects(plan, frame, mats, col) if detail else set()
    rs.setup_light(scene)
    rs.setup_camera(scene)
    return scene, replaced


def workbench(scene, width):
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = width
    scene.render.resolution_y = round(width * 9 / 16)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "BW"
    scene.render.film_transparent = False
    scene.display.render_aa = "16"
    sh = scene.display.shading
    sh.light = "FLAT"
    sh.color_type = "OBJECT"
    sh.show_shadows = False
    sh.show_cavity = False
    sh.show_object_outline = False
    sh.show_specular_highlight = False
    sh.background_type = "VIEWPORT" if hasattr(sh, "background_type") else sh.background_type
    if hasattr(sh, "background_color"):
        sh.background_color = (0.0, 0.0, 0.0)
    scene.world.color = (0.0, 0.0, 0.0)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


def render_mask(scene, path, visible, white):
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        o.hide_render = not visible(o.name)
        o.color = (1.0, 1.0, 1.0, 1.0) if white(o.name) else (0.0, 0.0, 0.0, 1.0)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print("mask", path.name, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, default=3840)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    scene, replaced = build(detail=True)
    workbench(scene, args.width)
    stage4 = lambda n: n in ("land", *rs.GROUND, *rs.ISLAND) or n.startswith("hd4-")  # noqa: E731
    stage5 = lambda n: rs.STAGES[5](n) and not n.startswith("hd4-") and n not in replaced  # noqa: E731
    render_mask(scene, out / "mask-site.png", lambda n: n in ("land", "graded-base", "graded-site"), lambda n: n == "graded-site")
    render_mask(scene, out / "mask-b4.png", stage4, lambda n: n.startswith("hd4-"))
    render_mask(scene, out / "mask-b5.png", stage5, lambda n: n not in GROUND_LIKE and not n.startswith(("roundabout", "lawn-")))


if __name__ == "__main__":
    main()
