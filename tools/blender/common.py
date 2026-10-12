"""Shared helpers for the diorama Blender scripts (owner: scene-lead).

Everything here is geometry plumbing: plan.json (render grid, y down, px) to Blender metres (y up in the plan = -Y in
Blender), clay materials, and a few bmesh builders. Run scripts with `tools/.venv-blender/bin/python tools/blender/<script>.py`.
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
PLAN_JSON = ROOT / "src/content/plan/plan.json"
BLEND_PATH = ROOT / "_source/blender/shiv-shiva.blend"
META_PATH = ROOT / "src/features/diorama/scene-meta.json"
FLOOR_HEIGHT_M = 3.0

# Typology tints from src/styles/tokens.css (light theme), used on roofs only.
TYPE_HEX = {
    "flats": "#2f6db0",
    "rowhouses": "#c9601f",
    "shops": "#1d8460",
    "mixed": "#6a5fa8",
    "office": "#d9d2c4",
}
BRICK_HEX = "#b5412f"
PAPER_HEX = "#f3efe7"

# Confirmed by the client (flats, mixed, shops A: 6 levels = ground + 5; row houses: 2 storeys) and used when plan.json
# still says floors "TBD". The roof terrace sits on top (parapet below). Office and amenities stay placeholders.
FLOORS_FALLBACK = {"flats": 6, "mixed": 6, "rowhouses": 2, "shops": 6, "office": 2}
CONFIRMED_TYPOLOGIES = ("flats", "mixed", "shops", "rowhouses")
TERRACE_PARAPET_M = 1.1   # roof terrace parapet, every confirmed typology
CORE_SIZE_M = (3.6, 5.2)  # stair and lift headroom block on a flat-block roof (plan x, y)
CORE_HEIGHT_M = 2.9


def load_plan() -> dict:
    return json.loads(PLAN_JSON.read_text())


class Frame:
    """Grid px (x right, y down) to metres centred on the site; plan y down becomes Blender -Y."""

    def __init__(self, plan: dict):
        xs = [p[0] for p in plan["boundary"]]
        ys = [p[1] for p in plan["boundary"]]
        self.mpp = plan["metresPerPx"]
        self.cx = (min(xs) + max(xs)) / 2
        self.cy = (min(ys) + max(ys)) / 2

    def xy(self, p) -> tuple[float, float]:
        return ((p[0] - self.cx) * self.mpp, -(p[1] - self.cy) * self.mpp)

    def pts(self, poly) -> list[tuple[float, float]]:
        return [self.xy(p) for p in poly]


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    h = h.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), alpha)


_MATS: dict[str, bpy.types.Material] = {}


def mat(name: str, hex_colour: str, roughness: float = 0.92) -> bpy.types.Material:
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_rgba(hex_colour)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    _MATS[name] = m
    return m


def clay_materials() -> dict[str, bpy.types.Material]:
    return {
        "clay": mat("clay", "#f4f1ea"),
        "clay-warm": mat("clay-warm", "#e8e2d6"),
        "outside": mat("outside", "#e6e4dd"),
        "road": mat("road", "#c4bfb5"),
        "lawn": mat("lawn", "#d3dcc6"),
        "tree": mat("tree", "#bccaa9"),
        "trunk": mat("trunk", "#cfc6b4"),
        "water": mat("water", "#c3d3d6", 0.35),
        "paved": mat("paved", "#ebe5d7"),
        "brick": mat("brick", BRICK_HEX),
        "car-white": mat("car-white", "#faf8f3"),
        "car-grey": mat("car-grey", "#c9c5bc"),
        **{f"roof-{k}": mat(f"roof-{k}", v) for k, v in TYPE_HEX.items()},
    }


def signed_area(pts) -> float:
    return 0.5 * sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))


def clean_ring(pts, eps: float = 1e-4):
    """Drop repeated points, a repeated closing point and return a CCW ring."""
    out = []
    for p in pts:
        if not out or math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) > eps:
            out.append(tuple(p))
    if len(out) > 1 and math.hypot(out[0][0] - out[-1][0], out[0][1] - out[-1][1]) <= eps:
        out.pop()
    if signed_area(out) < 0:
        out.reverse()
    return out


def new_object(name: str, bm: bmesh.types.BMesh, collection: bpy.types.Collection, materials=()) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    for m in materials:
        mesh.materials.append(m)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def prism_bm(ring, z0: float, z1: float, top_mat: int = 1, side_mat: int = 0) -> bmesh.types.BMesh:
    """Extrude a (possibly concave) ring from z0 to z1. Top face gets material `top_mat`, the rest `side_mat`."""
    ring = clean_ring(ring)
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z0)) for x, y in ring]
    bm.faces.new(verts[::-1])  # bottom faces down
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    new_verts = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=new_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    for f in bm.faces:
        f.material_index = top_mat if f.normal.z > 0.9 else side_mat
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4], ngon_method='EAR_CLIP')
    return bm


def ribbon_ring(line, width: float):
    """Outline (CCW ring) of a mitred ribbon along a polyline given in metres."""
    pts = [Vector((x, y)) for x, y in line]
    n = len(pts)
    left, right = [], []
    for i, p in enumerate(pts):
        prev_d = (p - pts[i - 1]).normalized() if i > 0 else None
        next_d = (pts[i + 1] - p).normalized() if i < n - 1 else None
        if prev_d is not None and next_d is not None and (prev_d + next_d).length > 1e-6:
            d = (prev_d + next_d).normalized()
        else:
            d = next_d if next_d is not None else prev_d
        nrm = Vector((-d.y, d.x))
        scale = 1.0
        if prev_d is not None and next_d is not None:
            scale = 1.0 / max(0.35, abs(nrm.dot(Vector((-next_d.y, next_d.x)))))
        left.append(p + nrm * (width / 2) * scale)
        right.append(p - nrm * (width / 2) * scale)
    return [(v.x, v.y) for v in left + right[::-1]]


def box_bm(sx: float, sy: float, sz: float, z0: float = 0.0) -> bmesh.types.BMesh:
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz + sz / 2 + z0))
    return bm


def point_in_ring(pt, ring) -> bool:
    x, y = pt
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def ring_centroid(ring) -> tuple[float, float]:
    a = signed_area(ring)
    if abs(a) < 1e-9:
        return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))
    cx = cy = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % len(ring)]
        c = x0 * y1 - x1 * y0
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    return (cx / (6 * a), cy / (6 * a))


def seeded(seed: int) -> random.Random:
    return random.Random(seed)


def polyline_length(line) -> float:
    return sum(math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]) for i in range(len(line) - 1))


def point_along(line, t: float):
    """Point and unit tangent at fraction t of a polyline."""
    target = polyline_length(line) * t
    acc = 0.0
    for i in range(len(line) - 1):
        seg = math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1])
        if acc + seg >= target and seg > 0:
            f = (target - acc) / seg
            p = (line[i][0] + (line[i + 1][0] - line[i][0]) * f, line[i][1] + (line[i + 1][1] - line[i][1]) * f)
            return p, ((line[i + 1][0] - line[i][0]) / seg, (line[i + 1][1] - line[i][1]) / seg)
        acc += seg
    p = line[-1]
    d = (line[-1][0] - line[-2][0], line[-1][1] - line[-2][1])
    ln = math.hypot(*d) or 1.0
    return p, (d[0] / ln, d[1] / ln)


def clip_line_to_rect(line, x0, y0, x1, y1):
    """Keep the part of a polyline inside a rect (metres), Liang-Barsky per segment."""
    out = []
    for a, b in zip(line, line[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        t0, t1 = 0.0, 1.0
        ok = True
        for p, q in ((-dx, a[0] - x0), (dx, x1 - a[0]), (-dy, a[1] - y0), (dy, y1 - a[1])):
            if abs(p) < 1e-12:
                if q < 0:
                    ok = False
                    break
            else:
                r = q / p
                if p < 0:
                    t0 = max(t0, r)
                else:
                    t1 = min(t1, r)
        if not ok or t0 >= t1:
            continue
        pa = (a[0] + dx * t0, a[1] + dy * t0)
        pb = (a[0] + dx * t1, a[1] + dy * t1)
        if not out or math.hypot(out[-1][0] - pa[0], out[-1][1] - pa[1]) > 1e-6:
            out.append(pa)
        out.append(pb)
    return out if len(out) >= 2 else list(line)


def merge_bms(bms) -> bmesh.types.BMesh:
    """Append several bmeshes into one (slots are kept as is)."""
    out = bmesh.new()
    for part in bms:
        mesh = bpy.data.meshes.new("tmp")
        part.to_mesh(mesh)
        part.free()
        out.from_mesh(mesh)
        bpy.data.meshes.remove(mesh)
    return out
