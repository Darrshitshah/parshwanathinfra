"""Storey detail for the hero stage renders only (owner: diorama-lead). Never used by the web diorama GLB.

Why: Nano Banana reads plain clay blocks as about 4 storeys. These builders keep every footprint and every height of the plain
model (6 x 3 m = 18 m to the terrace, + 1.1 m parapet; row houses 2 x 3 m) but give the facade a countable storey structure:

  * a projecting slab band at every floor level,
  * a recessed wall behind it, with vertical piers every ~3.6 m, so each bay is a shallow recess,
  * a dark glazing panel in every bay of every storey (one window row per storey),
  * flats, mixed use and shops A: an open taller ground level (3.6 m) on square stilt columns, then five upper levels (2.88 m),
  * a terrace with a 1.1 m parapet and the stair / lift headroom blocks (same sites as the web model),
  * row houses: 2 storeys, a floor band at 3 m, piers and glazing, plot parapet tiles stay as built by build_plots.

Stage 4 variant: bare RC frame (perimeter columns + full slabs) risen to the stage_levels() height, block infill on the lower
storeys, the top storeys left open so the slabs read.
"""
from __future__ import annotations

import math

import bmesh
import bpy

from build_ground import SITE_TOP
from build_town import _core_bm, _core_sites, _longest_edge_angle, building_bm, floors_for
from common import FLOOR_HEIGHT_M, TERRACE_PARAPET_M, clean_ring, hex_rgba, merge_bms, new_object, prism_bm

GROUND_H = 3.6          # flats: taller open ground level; the five upper levels share the rest of the 18 m
BAY_M = 3.6             # pier pitch
PIER_W = 0.9
RECESS_M = 0.75         # depth of the window bay behind the slab / pier plane
RECESS_GROUND_M = 2.4   # the stilt level is set back much further than the upper wall
STILT_W = 0.75          # square stilt column
SLAB_BELOW, SLAB_ABOVE = 0.5, 0.12
GLASS_HEX = "#8d9496"
ROWHOUSE_RECESS = 0.45


def level_bounds(typology: str, floors: int) -> list[float]:
    """Heights (m above the site slab) of the top of each storey. Total is always floors x 3 m."""
    total = floors * FLOOR_HEIGHT_M
    if typology == "rowhouses" or floors < 3:
        return [FLOOR_HEIGHT_M * (i + 1) for i in range(floors)]
    upper = (total - GROUND_H) / (floors - 1)
    return [GROUND_H + upper * i for i in range(floors)]


def inset_ring(ring, d: float):
    """Miter inset of a CCW ring by d metres. Returns None when the result collapses or flips."""
    n = len(ring)
    out = []
    for i in range(n):
        p0, p1, p2 = ring[i - 1], ring[i], ring[(i + 1) % n]
        e1 = (p1[0] - p0[0], p1[1] - p0[1])
        e2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1, l2 = math.hypot(*e1) or 1.0, math.hypot(*e2) or 1.0
        n1 = (-e1[1] / l1, e1[0] / l1)  # inward (left of a CCW edge)
        n2 = (-e2[1] / l2, e2[0] / l2)
        k = 1.0 + n1[0] * n2[0] + n1[1] * n2[1]
        if k < 0.25:
            k = 0.25
        out.append((p1[0] + d * (n1[0] + n2[0]) / k, p1[1] + d * (n1[1] + n2[1]) / k))
    a0 = _area(ring)
    a1 = _area(out)
    if a1 <= 0 or a1 < 0.25 * a0:
        return None
    return out


def _area(pts) -> float:
    return 0.5 * sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))


def add_box(bm, cx, cy, ux, uy, length, depth, z0, z1, out_off=0.0):
    """Oriented box. (ux, uy) is the unit direction along the facade; the box is `depth` thick, its outer face `out_off`
    metres outside the centre line (outward = right of a CCW edge)."""
    ox, oy = uy, -ux
    cx2, cy2 = cx + ox * out_off, cy + oy * out_off
    hl, hd = length / 2, depth / 2
    corners = [(-hl, -hd), (hl, -hd), (hl, hd), (-hl, hd)]
    pts = [(cx2 + ux * a + ox * b, cy2 + uy * a + oy * b) for a, b in corners]
    lo = [bm.verts.new((x, y, z0)) for x, y in pts]
    hi = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(lo[::-1])
    bm.faces.new(hi)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))


def edge_stations(ring, pitch: float, min_len: float = 2.6):
    """Yield (px, py, ux, uy, length, i) for each pier station along each edge, including both edge ends."""
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        if length < min_len:
            continue
        ux, uy = (b[0] - a[0]) / length, (b[1] - a[1]) / length
        n = max(1, round(length / pitch))
        for i in range(n + 1):
            t = length * i / n
            yield a[0] + ux * t, a[1] + uy * t, ux, uy, length / n, i, n


def edge_bays(ring, pitch: float, min_len: float = 2.6):
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        if length < min_len:
            continue
        ux, uy = (b[0] - a[0]) / length, (b[1] - a[1]) / length
        n = max(1, round(length / pitch))
        for i in range(n):
            t = length * (i + 0.5) / n
            yield a[0] + ux * t, a[1] + uy * t, ux, uy, length / n


class Meshes:
    """One bmesh per material slot, flushed to one object each."""

    def __init__(self):
        self.clay, self.core, self.glass = bmesh.new(), bmesh.new(), bmesh.new()

    def add_prism(self, target, ring, z0, z1):
        part = prism_bm(ring, z0, z1, top_mat=0, side_mat=0)
        mesh = bpy.data.meshes.new("tmp")
        part.to_mesh(mesh)
        part.free()
        target.from_mesh(mesh)
        bpy.data.meshes.remove(mesh)


def facade_levels(ring, bounds, kind: str, m: Meshes, glazing: bool) -> None:
    """Slabs, piers, recessed wall and glazing for one building ring (clean, CCW, metres, z relative to the site slab)."""
    z_site = SITE_TOP
    stilts = kind == "stilts"
    rec_up = ROWHOUSE_RECESS if kind == "rowhouse" else RECESS_M
    up_ring = inset_ring(ring, rec_up) or ring
    g_ring = (inset_ring(ring, RECESS_GROUND_M) if stilts else up_ring) or up_ring
    tops = bounds
    # core mass: ground level set back (stilts) or like the rest, upper storeys recessed
    m.add_prism(m.core, g_ring, z_site - 0.02, z_site + tops[0])
    m.add_prism(m.core, up_ring, z_site + tops[0], z_site + tops[-1] - SLAB_BELOW)
    # slab bands at every storey top except the last (the terrace parapet block closes the building)
    for k, z in enumerate(tops[:-1]):
        m.add_prism(m.clay, ring, z_site + z - SLAB_BELOW, z_site + z + SLAB_ABOVE)
    # stilt columns or ground piers, then upper piers and glazing bay by bay
    for k in range(len(tops)):
        z_lo = z_site + (0.0 if k == 0 else tops[k - 1] + SLAB_ABOVE)
        z_hi = z_site + tops[k] - SLAB_BELOW
        if k == 0 and stilts:
            if glazing:  # dark lobby / shopfront band on the set-back ground wall, so the ground level also reads as a storey
                for x, y, ux, uy, bay in edge_bays(g_ring, BAY_M):
                    add_box(m.glass, x, y, ux, uy, max(0.8, bay - 0.9), 0.1, z_site + 0.35, z_site + 2.7, out_off=0.05)
            for x, y, ux, uy, _l, i, n in edge_stations(ring, BAY_M):
                add_box(m.clay, x, y, ux, uy, STILT_W, STILT_W, z_site - 0.02, z_site + tops[0] - SLAB_BELOW, out_off=-STILT_W / 2 + 0.0)
            continue
        depth = rec_up
        for x, y, ux, uy, _l, i, n in edge_stations(ring, BAY_M):
            add_box(m.clay, x, y, ux, uy, PIER_W, depth, z_lo, z_hi, out_off=-depth / 2 + 0.0)
        if glazing:
            win_h = min(1.5, (z_hi - z_lo) - 0.75)
            sill = z_lo + 0.5
            for x, y, ux, uy, bay in edge_bays(ring, BAY_M):
                add_box(m.glass, x, y, ux, uy, max(0.8, bay - PIER_W - 0.7), 0.1, sill, sill + win_h, out_off=-rec_up + 0.06)


def roof_terrace(ring, rel_top: float, m: Meshes, with_cores: bool) -> None:
    """Parapet block above the last slab: terrace floor at `rel_top`, parapet to + 1.1 m, then the headroom blocks."""
    z0 = SITE_TOP + rel_top - SLAB_BELOW
    bm = building_bm(ring, z0, SLAB_BELOW + TERRACE_PARAPET_M, TERRACE_PARAPET_M, rim=0.45)
    mesh = bpy.data.meshes.new("tmp")
    bm.to_mesh(mesh)
    bm.free()
    m.clay.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    if with_cores:
        ang = _longest_edge_angle(ring)
        for sx, sy in _core_sites(ring):
            core = _core_bm(sx, sy, ang, SITE_TOP + rel_top)
            mesh = bpy.data.meshes.new("tmp")
            core.to_mesh(mesh)
            core.free()
            m.clay.from_mesh(mesh)
            bpy.data.meshes.remove(mesh)


def detailed_building(b: dict, ring_m, m: Meshes) -> None:
    floors, _ = floors_for(b)
    rowhouse = b["typology"] == "rowhouses"
    ring = clean_ring(ring_m)
    bounds = level_bounds(b["typology"], floors)
    kind = "rowhouse" if rowhouse else "stilts"
    facade_levels(ring, bounds, kind, m, glazing=True)
    if rowhouse:
        # flat roof slab at 6 m; plot parapet tiles (plots-*) sit on it
        m.add_prism(m.clay, ring, SITE_TOP + bounds[-1] - SLAB_BELOW, SITE_TOP + bounds[-1] + 0.0)
    else:
        roof_terrace(ring, bounds[-1], m, with_cores=True)


def frame_building(b: dict, ring_m, levels: int, m: Meshes) -> None:
    """Stage 4: RC frame risen to `levels` storeys of the final building."""
    floors, _ = floors_for(b)
    rowhouse = b["typology"] == "rowhouses"
    ring = clean_ring(ring_m)
    bounds = level_bounds(b["typology"], floors)
    z_site = SITE_TOP
    infill_to = (levels - 1) if rowhouse else (levels - 2)  # storeys (1 based) that already have block walls
    wall_ring = inset_ring(ring, 0.5) or ring
    for k in range(levels):
        z_lo = z_site + (0.0 if k == 0 else bounds[k - 1] + SLAB_ABOVE)
        z_hi = z_site + bounds[k] - SLAB_BELOW
        for x, y, ux, uy, _l, i, n in edge_stations(ring, BAY_M):
            w = STILT_W if (k == 0 and not rowhouse) else 0.6
            add_box(m.clay, x, y, ux, uy, w, w, z_lo, z_hi, out_off=-w / 2)
        m.add_prism(m.clay, ring, z_site + bounds[k] - SLAB_BELOW, z_site + bounds[k] + SLAB_ABOVE)
        stilt_level = k == 0 and not rowhouse
        if (k + 1) <= infill_to and not stilt_level:
            m.add_prism(m.core, wall_ring, z_lo, z_hi)
    # column stubs rising from the last slab so the next storey reads as coming
    top = z_site + bounds[levels - 1] + SLAB_ABOVE
    for x, y, ux, uy, _l, i, n in edge_stations(ring, BAY_M):
        add_box(m.clay, x, y, ux, uy, 0.6, 0.6, top, top + 1.5, out_off=-0.3)


def flush(m: Meshes, col, mats, name: str) -> list:
    """Turn the three bmeshes into objects named hd<name>-clay / -core / -glass."""
    glass = bpy.data.materials.get("hd-glass") or bpy.data.materials.new("hd-glass")
    glass.use_nodes = True
    b = glass.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hex_rgba(GLASS_HEX)
    b.inputs["Roughness"].default_value = 0.55
    objs = []
    for suffix, bm, material in (("clay", m.clay, mats["clay"]), ("core", m.core, mats["clay-warm"]), ("glass", m.glass, glass)):
        if len(bm.verts):
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            objs.append(new_object(f"hd{name}-{suffix}", bm, col, [material]))
        else:
            bm.free()
    return objs
