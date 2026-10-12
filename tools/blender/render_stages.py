"""Five construction stages of the township from the SS-01 hero camera (owner: diorama-lead).

    tools/.venv-blender/bin/python tools/blender/render_stages.py [--out _source/generated/hero-stages] [--samples 64] [--only 3]

Needs `_source/blender/shiv-shiva.blend` (build_scene.py) and `hero_camera.json` (hero_camera.py). Renders 2560 x 1440 clay
white images, same camera and same low late-afternoon sun as the aerial, then a 1600 px wide contact sheet:
  1 bare graded land, the plan's road edges marked like survey lines (pegs, no kerbs)
  2 roads and kerbs built, roundabout island
  3 plinths of every footprint
  4 flat blocks about half risen (2 to 4 of 6 levels), row houses 1 or 2 of 2 storeys, no terraces yet
  5 full massing: terraces, parapets, stair/lift blocks, trees, cars, gate piers, amenities
The vertical field of view of the aerial is kept, so the whole aerial frame sits in the middle with extra land at both sides.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy  # noqa: F401  (before bmesh, which common imports)
import numpy as np
from mathutils import Vector

import build_ground
from build_ground import LAWN_TOP, RECT_PX, SITE_TOP, rect_ring
from build_town import floors_for
from common import BLEND_PATH, FLOOR_HEIGHT_M, ROOT, Frame, clip_line_to_rect, hex_rgba, load_plan, merge_bms, new_object, prism_bm, ribbon_ring
from render_stills import configure

CAMERA_JSON = Path(__file__).resolve().parent / "hero_camera.json"
OUT_DEFAULT = ROOT / "_source/generated/hero-stages"
WIDTH, HEIGHT = 2560, 1440
SUN_AZIMUTH_DEG, SUN_ELEVATION_DEG = 235.0, 32.0  # low sun in the south-west: it lights the faces the camera sees, as in the aerial
PLINTH_M = 1.0
SURVEY_LINE_M, PEG_SPACING_M = 0.7, 28.0
PAPER = "#ebe7dc"  # land colour; the sky is a touch lighter
SKY = "#f6f2e6"

# One clay white palette for every stage (typology tints and brick are dropped on purpose).
PALETTE = {
    "clay": "#f5f2ea", "clay-warm": "#ece6d9", "outside": "#e9e5da", "road": "#a39e94", "lawn": "#e2e8d6",
    "tree": "#d7dec9", "trunk": "#d8cfbd", "water": "#cfdcdc", "paved": "#efe9dc", "brick": "#e3d9c8",
    "car-white": "#faf8f3", "car-grey": "#d6d2c9",
    **{f"roof-{k}": "#f1eee6" for k in ("flats", "rowhouses", "shops", "mixed", "office")},
}


def recolour() -> None:
    for name, hex_colour in PALETTE.items():
        m = bpy.data.materials.get(name)
        if m:
            m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = hex_rgba(hex_colour)


def flat_material(name: str, hex_colour: str):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hex_rgba(hex_colour)
    b.inputs["Roughness"].default_value = 0.95
    return m


def setup_camera(scene) -> None:
    cam = json.loads(CAMERA_JSON.read_text())
    data = bpy.data.cameras.new("hero")
    data.sensor_fit = "VERTICAL"
    data.angle_y = 2 * math.atan(cam["frame"][1] / 2 / cam["focalPx"])
    data.clip_start, data.clip_end = 1.0, 90000.0
    obj = bpy.data.objects.new("hero", data)
    scene.collection.objects.link(obj)
    obj.location = cam["position"]
    obj.rotation_euler = cam["rotationEuler"]
    scene.camera = obj


def setup_light(scene) -> None:
    for o in [o for o in scene.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o, do_unlink=True)
    world = scene.world or bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld")
    visible = nodes.new("ShaderNodeBackground")  # what the camera sees: sky and haze at full strength
    visible.inputs["Color"].default_value = hex_rgba(SKY)
    visible.inputs["Strength"].default_value = 1.0
    ambient = nodes.new("ShaderNodeBackground")  # what lights the clay: a softer sky
    ambient.inputs["Color"].default_value = hex_rgba("#f3f0ea")
    ambient.inputs["Strength"].default_value = 0.55
    path = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(ambient.outputs["Background"], mix.inputs[1])
    links.new(visible.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 2.2
    sun.angle = math.radians(7)  # soft shadow edges
    sun.color = (1.0, 0.97, 0.91)  # slightly warm, late afternoon
    obj = bpy.data.objects.new("sun", sun)
    az, el = math.radians(SUN_AZIMUTH_DEG), math.radians(SUN_ELEVATION_DEG)
    to_sun = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))
    obj.rotation_euler = (-to_sun).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(obj)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


def land_plane(frame: Frame, col) -> None:
    """Light land to the horizon in the colour of the sky, so the model sits on open ground without a seam.
    Four strips around the model's ground slab (a full plane would bury the sunken roads)."""
    x0, y0, x1, y1 = build_ground.rect_metres(frame)
    big = 40000.0
    strips = [
        [(-big, y1), (big, y1), (big, big), (-big, big)],
        [(-big, -big), (big, -big), (big, y0), (-big, y0)],
        [(-big, y0), (x0, y0), (x0, y1), (-big, y1)],
        [(x1, y0), (big, y0), (big, y1), (x1, y1)],
    ]
    bm = merge_bms([prism_bm(r, -BASE_BELOW, -0.01) for r in strips])
    new_object("land", bm, col, [flat_material("land", PAPER)])


BASE_BELOW = 3.2


def survey_lines(plan, frame: Frame, col, mats) -> None:
    """Stage 1: road edges as thin painted lines with a peg every 28 m, the roundabout ring and the site boundary."""
    rx0, ry0, rx1, ry1 = build_ground.rect_metres(frame)
    paint = flat_material("survey-paint", "#d8642f")
    peg_top = flat_material("survey-peg", "#f7f3ea")
    parts, pegs = [], []
    for road in plan["roads"]:
        width = road["widthM"] if isinstance(road["widthM"], (int, float)) else 6.1
        line = clip_line_to_rect(frame.pts(road["centerline"]), rx0 + 0.01, ry0 + 0.01, rx1 - 0.01, ry1 - 0.01)
        for side in (-1, 1):
            edge = _offset(line, side * width / 2)
            parts.append(prism_bm(ribbon_ring(edge, SURVEY_LINE_M), SITE_TOP, SITE_TOP + 0.06))
            pegs += _peg_points(edge)
    cx, cy = frame.xy(plan["roundabout"]["center"])
    r = plan["roundabout"]["radius"] * frame.mpp + build_ground.ROUNDABOUT_RING_M
    ring = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i * math.tau / 72 for i in range(73)]]
    parts.append(prism_bm(ribbon_ring(ring, SURVEY_LINE_M), SITE_TOP, SITE_TOP + 0.06))
    pegs += _peg_points(ring)
    boundary = frame.pts(plan["boundary"]) + [frame.xy(plan["boundary"][0])]
    parts.append(prism_bm(ribbon_ring(boundary, 0.7), SITE_TOP, SITE_TOP + 0.05))
    new_object("survey-lines", merge_bms(parts), col, [paint])
    peg_parts = []
    for x, y in pegs:
        from common import box_bm

        bm = box_bm(0.3, 0.3, 1.1, SITE_TOP)
        for v in bm.verts:
            v.co.x += x
            v.co.y += y
        peg_parts.append(bm)
    new_object("survey-pegs", merge_bms(peg_parts), col, [peg_top])


def _offset(line, d: float):
    out = []
    for i, p in enumerate(line):
        a, b = line[max(i - 1, 0)], line[min(i + 1, len(line) - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, ty) or 1.0
        out.append((p[0] - ty / n * d, p[1] + tx / n * d))
    return out


def _peg_points(line):
    pts, acc, nxt = [], 0.0, 0.0
    for a, b in zip(line, line[1:]):
        seg = math.hypot(b[0] - a[0], b[1] - a[1])
        while nxt <= acc + seg and seg > 0:
            f = (nxt - acc) / seg
            pts.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
            nxt += PEG_SPACING_M
        acc += seg
    return pts


def flat_ground(plan, frame: Frame, mats, col) -> None:
    ring = rect_ring(frame)
    earth = flat_material("earth", "#e4dccb")
    new_object("graded-base", prism_bm(ring, -build_ground.BASE_DEPTH, 0.0, top_mat=0, side_mat=1), col, [mats["outside"], mats["clay-warm"]])
    new_object("graded-site", prism_bm(frame.pts(plan["boundary"]), 0.0, SITE_TOP, top_mat=0, side_mat=1), col, [earth, mats["clay-warm"]])


def plinths(plan, frame: Frame, mats, col) -> None:
    parts = [prism_bm(frame.pts(b["polygon"]), SITE_TOP - 0.02, SITE_TOP + PLINTH_M, top_mat=0, side_mat=0) for b in plan["buildings"]]
    new_object("plinths", merge_bms(parts), col, [mats["clay"]])


def stage_levels(plan):
    """Deterministic half-built state per building: flats 2 to 4 of 6 levels, shops and mixed use 3, row-house strips 1 or 2 storeys."""
    levels = {}
    flat_i = rh_i = 0
    for b in plan["buildings"]:
        full, _ = floors_for(b)
        if b["typology"] == "rowhouses":
            levels[b["id"]] = 1 if rh_i % 3 == 0 else 2
            rh_i += 1
        elif b["typology"] == "office":
            levels[b["id"]] = full
        elif b["typology"] in ("shops", "mixed"):
            levels[b["id"]] = 3
        else:
            levels[b["id"]] = (3, 2, 4, 3, 3)[flat_i % 5]
            flat_i += 1
    return levels


def half_built(plan, frame: Frame, mats, col) -> None:
    levels = stage_levels(plan)
    parts = [prism_bm(frame.pts(b["polygon"]), SITE_TOP - 0.02, SITE_TOP + levels[b["id"]] * FLOOR_HEIGHT_M, top_mat=0, side_mat=0) for b in plan["buildings"]]
    new_object("half-built", merge_bms(parts), col, [mats["clay"]])


def set_visibility(keep) -> None:
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.hide_render = not keep(o.name)


GROUND = ("ground-base", "ground-site")
ISLAND = ("roundabout-kerb", "roundabout-lawn")


def is_building_shell(n: str) -> bool:
    return n.startswith(("b-", "plots-", "a-", "tree-", "car-", "lawn-", "entry-pier", "rowhouse-pier", "sculpture"))


STAGES = {
    1: lambda n: n in ("land", "graded-base", "graded-site", "survey-lines", "survey-pegs"),
    2: lambda n: n in ("land", *GROUND, *ISLAND),
    3: lambda n: n in ("land", *GROUND, *ISLAND, "plinths"),
    4: lambda n: n in ("land", *GROUND, *ISLAND, "half-built"),
    5: lambda n: n == "land" or not (n in ("graded-base", "graded-site", "survey-lines", "survey-pegs", "plinths", "half-built")),
}


def contact_sheet(paths: list[Path], out: Path) -> None:
    cols, gap, sheet_w = 3, 12, 1600
    cell_w = (sheet_w - gap * (cols + 1)) // cols
    cell_h = round(cell_w * 9 / 16)
    rows = math.ceil(len(paths) / cols)
    sheet_h = gap + rows * (cell_h + gap)
    sheet = np.ones((sheet_h, sheet_w, 4), np.float32) * np.array([0.93, 0.92, 0.89, 1.0], np.float32)
    for i, path in enumerate(paths):
        img = bpy.data.images.load(str(path))
        img.scale(cell_w, cell_h)
        a = np.array(img.pixels[:], np.float32).reshape(cell_h, cell_w, 4)
        r, c = divmod(i, cols)
        y = sheet_h - (gap + (r + 1) * cell_h + r * gap)  # image rows run bottom to top
        x = gap + c * (cell_w + gap)
        sheet[y : y + cell_h, x : x + cell_w] = a
        _digit(sheet, i + 1, x + 14, y + cell_h - 14 - 28)
    res = bpy.data.images.new("sheet", sheet_w, sheet_h)
    res.pixels[:] = sheet.ravel()
    res.filepath_raw = str(out)
    res.file_format = "PNG"
    res.save()


_DIGITS = {
    1: ("010", "110", "010", "010", "010", "010", "111"), 2: ("111", "001", "001", "111", "100", "100", "111"),
    3: ("111", "001", "001", "111", "001", "001", "111"), 4: ("101", "101", "101", "111", "001", "001", "001"),
    5: ("111", "100", "100", "111", "001", "001", "111"),
}


def _digit(sheet, n: int, x: int, y: int, k: int = 4) -> None:
    """Stage number in the corner of a contact sheet cell (tiny bitmap font, y is the bottom row)."""
    rows = _DIGITS[n]
    sheet[y - 2 * k : y + 7 * k + 2 * k, x - 2 * k : x + 3 * k + 2 * k] = np.array([1, 1, 1, 0.85], np.float32)
    for ry, row in enumerate(rows):
        for rx, ch in enumerate(row):
            if ch == "1":
                sheet[y + (6 - ry) * k : y + (7 - ry) * k, x + rx * k : x + (rx + 1) * k] = np.array([0.15, 0.15, 0.15, 1], np.float32)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--only", type=int, default=0)
    ap.add_argument("--engine", default="EEVEE")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    plan = load_plan()
    frame = Frame(plan)
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    scene = bpy.context.scene
    recolour()
    mats = {m.name: m for m in bpy.data.materials}
    col = bpy.data.collections.new("Stages")
    scene.collection.children.link(col)
    land_plane(frame, col)
    survey_lines(plan, frame, col, mats)
    flat_ground(plan, frame, mats, col)
    plinths(plan, frame, mats, col)
    half_built(plan, frame, mats, col)
    setup_light(scene)
    setup_camera(scene)
    configure(WIDTH, args.engine, args.samples)
    scene.render.resolution_y = HEIGHT
    done = []
    for n in range(1, 6):
        path = out / f"stage-{n}.png"
        if not args.only or args.only == n:
            set_visibility(STAGES[n])
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            print("stage", n, flush=True)
        done.append(path)
    if all(p.exists() for p in done):
        contact_sheet(done, out / "contact-sheet.png")
        print("contact sheet")


if __name__ == "__main__":
    main()
