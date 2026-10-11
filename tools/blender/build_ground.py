"""Ground, roads (sunken, with kerbs), lawns and the roundabout (owner: scene-lead)."""
from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Matrix

from common import (
    Frame,
    clip_line_to_rect,
    merge_bms,
    new_object,
    prism_bm,
    ribbon_ring,
)

SITE_TOP = 0.12  # site slab above the surrounding ground
ROAD_FLOOR = -0.12  # sunken carriageway; the trench walls read as kerbs
LAWN_TOP = SITE_TOP + 0.10
BASE_DEPTH = 3.0
# Grid rectangle (px) of the model: the viewBox of the web plan, a little wider than the highway.
RECT_PX = (0.0, 238.0, 1960.0, 1108.0)
ROUNDABOUT_RING_M = 8.0  # carriageway width around the island


def rect_ring(frame: Frame):
    x0, y0, x1, y1 = RECT_PX
    return [frame.xy(p) for p in ((x0, y1), (x1, y1), (x1, y0), (x0, y0))]


def rect_metres(frame: Frame):
    x0, y0, x1, y1 = RECT_PX
    a, b = frame.xy((x0, y1)), frame.xy((x1, y0))
    return (a[0], a[1], b[0], b[1])


def _apply_boolean(obj, cutter) -> None:
    mod = obj.modifiers.new("trench", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    mod.solver = "EXACT"
    mod.use_self = True
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def _cutter(plan, frame: Frame, collection):
    """One mesh holding every road ribbon plus the roundabout ring, from below the road floor to above the kerb."""
    rx0, ry0, rx1, ry1 = rect_metres(frame)
    parts = []
    for road in plan["roads"]:
        width = road["widthM"] if isinstance(road["widthM"], (int, float)) else 6.1
        line = clip_line_to_rect(frame.pts(road["centerline"]), rx0 + 0.01, ry0 + 0.01, rx1 - 0.01, ry1 - 0.01)
        parts.append(prism_bm(ribbon_ring(line, width), ROAD_FLOOR, 1.5))
    cx, cy = frame.xy(plan["roundabout"]["center"])
    r = plan["roundabout"]["radius"] * frame.mpp + ROUNDABOUT_RING_M
    ring = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i * math.tau / 40 for i in range(40)]]
    parts.append(prism_bm(ring, ROAD_FLOOR, 1.5))
    return new_object("road-cutter", merge_bms(parts), collection)


def _retag_trench(obj, slot_road: int, slot_wall: int) -> None:
    """After the boolean: road floors get the road slot, vertical trench walls the kerb slot."""
    for poly in obj.data.polygons:
        z = poly.center.z
        if poly.normal.z > 0.9 and z < ROAD_FLOOR + 0.05:
            poly.material_index = slot_road
        elif abs(poly.normal.z) < 0.3 and z > ROAD_FLOOR - 0.01 and poly.center.z < SITE_TOP + 0.01:
            poly.material_index = slot_wall


def build_ground(plan, frame: Frame, mats, col):
    ring = rect_ring(frame)
    base = new_object("ground-base", prism_bm(ring, -BASE_DEPTH, 0.0, top_mat=0, side_mat=1), col,
                      [mats["outside"], mats["clay-warm"], mats["road"]])
    boundary = frame.pts(plan["boundary"])
    site = new_object("ground-site", prism_bm(boundary, 0.0, SITE_TOP, top_mat=0, side_mat=1), col,
                      [mats["clay"], mats["paved"], mats["road"]])
    cutter = _cutter(plan, frame, col)
    for obj in (base, site):
        _apply_boolean(obj, cutter)
    # Paint trench: floors road grey, walls kerb paving.
    for obj in (base, site):
        _retag_trench(obj, 2, 1)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return base, site


def build_lawns(plan, frame: Frame, mats, col):
    objs = []
    for g in plan["gardens"]:
        ring = frame.pts(g["polygon"])
        objs.append(new_object(f"lawn-{g['id']}", prism_bm(ring, SITE_TOP - 0.02, LAWN_TOP, top_mat=0, side_mat=1), col,
                               [mats["lawn"], mats["paved"]]))
    return objs


def build_roundabout(plan, frame: Frame, mats, col, brick):
    """Raised planted island, kerb ring and a brick-red sculpture (stepped obelisk with a sphere)."""
    cx, cy = frame.xy(plan["roundabout"]["center"])
    r = plan["roundabout"]["radius"] * frame.mpp
    n = 36
    def circle(rad):
        return [(cx + rad * math.cos(i * math.tau / n), cy + rad * math.sin(i * math.tau / n)) for i in range(n)]
    ring_kerb = new_object("roundabout-kerb", prism_bm(circle(r), ROAD_FLOOR - 0.02, 0.55, top_mat=0, side_mat=1), col,
                           [mats["paved"], mats["paved"]])
    lawn = new_object("roundabout-lawn", prism_bm(circle(r - 0.7), 0.5, 0.62, top_mat=0, side_mat=1), col,
                      [mats["lawn"], mats["paved"]])
    pedestal = new_object("sculpture-pedestal", prism_bm(circle(2.3), 0.6, 1.6, top_mat=0, side_mat=1), col,
                          [mats["paved"], mats["clay"]])
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=6, radius1=1.1, radius2=0.35, depth=5.2)
    for v in bm.verts:
        v.co.z += 1.6 + 2.6
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.95,
                              matrix=Matrix.Translation((0, 0, 1.6 + 5.2 + 0.7)))
    obelisk = new_object("sculpture", bm, col, [brick])
    obelisk.location = (cx, cy, 0)  # the sculpture mesh is built around the origin
    return [ring_kerb, lawn, pedestal, obelisk], (cx, cy, r)
