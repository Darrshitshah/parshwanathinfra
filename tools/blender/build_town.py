"""Buildings, amenities, gates, trees and cars (owner: scene-lead). Heights are indicative, see build_scene.py."""
from __future__ import annotations

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

from build_ground import LAWN_TOP, SITE_TOP
from common import (
    CONFIRMED_TYPOLOGIES,
    CORE_HEIGHT_M,
    CORE_SIZE_M,
    FLOOR_HEIGHT_M,
    FLOORS_FALLBACK,
    TERRACE_PARAPET_M,
    Frame,
    box_bm,
    clean_ring,
    merge_bms,
    new_object,
    point_along,
    point_in_ring,
    polyline_length,
    prism_bm,
    ring_centroid,
    seeded,
)

PARAPET_ROWHOUSE = TERRACE_PARAPET_M
PARAPET_OTHER = 0.45      # amenity and office roofs, not confirmed terraces
PARAPET_WIDTH = 0.5
CORE_EDGE_CLEAR_M = 4.5   # headroom blocks keep this far from the roof edge
CORE_SPACING_M = 38.0     # and this far from each other


def floors_for(b: dict) -> tuple[int, bool]:
    """Floors used for massing. Returns (floors, confirmed). plan.json `floors` wins when it is a number; flats, mixed use,
    shops A and row houses are confirmed at 6 / 6 / 6 / 2 even while the plan still says TBD."""
    if isinstance(b.get("floors"), int):
        return b["floors"], True
    if b["typology"] in CONFIRMED_TYPOLOGIES:
        return FLOORS_FALLBACK[b["typology"]], True
    return FLOORS_FALLBACK.get(b["typology"], 3), False


def building_bm(ring, z0: float, height: float, parapet: float, rim: float = PARAPET_WIDTH):
    """Walls (slot 0), parapet rim top (slot 0) and a recessed roof (slot 1)."""
    ring = clean_ring(ring)
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z0)) for x, y in ring]
    bm.faces.new(verts[::-1])
    bm.normal_update()
    res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    top_verts = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, height), verts=top_verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    top = next(f for f in bm.faces if f.normal.z > 0.9)
    bmesh.ops.inset_region(bm, faces=[top], thickness=rim, depth=0.0, use_boundary=True)
    for v in top.verts:
        v.co.z -= parapet
    bm.normal_update()
    for f in bm.faces:
        f.material_index = 1 if f is top else 0
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4], ngon_method="EAR_CLIP")
    return bm


def _core_sites(ring) -> list[tuple[float, float]]:
    """Spots for stair and lift headroom blocks: deep inside the roof, spread out along the building."""
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    step = 1.5
    samples = []
    x = min(xs)
    while x <= max(xs):
        y = min(ys)
        while y <= max(ys):
            if point_in_ring((x, y), ring):
                samples.append((x, y, _edge_distance((x, y), ring)))
            y += step
        x += step
    area = abs(sum(ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1] for i in range(len(ring)))) / 2
    want = max(1, min(5, round(area / 900.0)))
    for clear in (CORE_EDGE_CLEAR_M, 3.0, 1.5, 0.0):
        pool = [s for s in samples if s[2] >= clear]
        if pool:
            break
    else:
        return []
    chosen = [max(pool, key=lambda s: s[2])]
    while len(chosen) < want:
        far = max(pool, key=lambda s: min(math.hypot(s[0] - c[0], s[1] - c[1]) for c in chosen))
        if min(math.hypot(far[0] - c[0], far[1] - c[1]) for c in chosen) < CORE_SPACING_M:
            break
        chosen.append(far)
    return [(c[0], c[1]) for c in chosen]


def _core_bm(cx: float, cy: float, angle: float, z0: float):
    bm = box_bm(CORE_SIZE_M[0], CORE_SIZE_M[1], CORE_HEIGHT_M, z0)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(angle, 3, "Z"))
    bmesh.ops.translate(bm, vec=(cx, cy, 0), verts=bm.verts)
    for f in bm.faces:
        f.material_index = 0
    return bm


def _longest_edge_angle(ring) -> float:
    best, ang = 0.0, 0.0
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        if d > best:
            best, ang = d, math.atan2(b[1] - a[1], b[0] - a[0])
    return ang


def build_buildings(plan, frame: Frame, mats, col):
    """Flats, mixed use and shops A: `floors` levels, a roof terrace with a 1.1 m parapet and stair/lift headroom blocks.
    Row-house strips stop at the 2nd storey; their terrace parapets are drawn per plot (build_plots)."""
    info = []
    for b in plan["buildings"]:
        floors, confirmed = floors_for(b)
        slab = floors * FLOOR_HEIGHT_M          # terrace level above the site slab
        ring = frame.pts(b["polygon"])
        rowhouse = b["typology"] == "rowhouses"
        terrace = confirmed and not rowhouse
        parapet = TERRACE_PARAPET_M if terrace else (0.0 if rowhouse else PARAPET_OTHER)
        height = slab + (TERRACE_PARAPET_M if terrace else 0.0)
        bm = building_bm(ring, SITE_TOP, height, parapet)
        cores = 0
        if terrace:
            clean = clean_ring(ring)
            ang = _longest_edge_angle(clean)
            sites = _core_sites(clean)
            cores = len(sites)
            if sites:
                bm = merge_bms([bm] + [_core_bm(sx, sy, ang, SITE_TOP + slab) for sx, sy in sites])
        obj = new_object(f"b-{b['id']}", bm, col, [mats["clay"], mats[f"roof-{b['typology']}"]])
        cx, cy = ring_centroid(clean_ring(ring))
        info.append({
            "id": b["id"], "typology": b["typology"], "floorsUsed": floors, "floorsConfirmed": confirmed,
            "heightM": round(slab + SITE_TOP, 2), "parapetM": TERRACE_PARAPET_M if (terrace or rowhouse) else 0.0,
            "coreBlocks": cores, "centre": [round(cx, 2), round(cy, 2)], "indicative": bool(b.get("indicative")) or not confirmed,
        })
    return info


def build_plots(plan, frame: Frame, mats, col):
    """One low parapet tile per row-house plot (165), merged per strip. Plot positions are indicative, as in plan.json."""
    by_strip: dict[str, list] = {}
    for plot in plan["plots"]:
        by_strip.setdefault(plot["strip"], []).append(plot)
    strip_height = {b["id"]: floors_for(b)[0] * FLOOR_HEIGHT_M for b in plan["buildings"]}
    for strip, plots in by_strip.items():
        z0 = SITE_TOP + strip_height.get(strip, 2 * FLOOR_HEIGHT_M) - 0.1  # terrace floor lands exactly on the 2nd-storey slab
        parts = [building_bm(frame.pts(p["polygon"]), z0, PARAPET_ROWHOUSE, PARAPET_ROWHOUSE - 0.1, rim=0.3) for p in plots]
        new_object(f"plots-{strip}", merge_bms(parts), col, [mats["clay"], mats["roof-rowhouses"]])
    return len(plan["plots"])


def _circle(cx, cy, r, n=28):
    return [(cx + r * math.cos(i * math.tau / n), cy + r * math.sin(i * math.tau / n)) for i in range(n)]


def build_amenities(plan, frame: Frame, mats, col):
    """Only what plan.json lists. Playgrounds and the fountain stay low; the three buildings are plain indicative blocks."""
    out = []
    for a in plan["amenities"]:
        kind, aid = a["kind"], a["id"]
        poly = frame.pts(a["polygon"]) if a.get("polygon") else None
        px, py = frame.xy(a["point"])
        if kind == "playground":
            ring = poly or _circle(px, py, 9.0)
            new_object(f"a-{aid}", prism_bm(ring, LAWN_TOP - 0.03, LAWN_TOP + 0.05, top_mat=0, side_mat=1), col,
                       [mats["paved"], mats["clay-warm"]])
            for k in range(3):  # three play frames, abstract blocks
                cx, cy = ring_centroid(clean_ring(ring))
                o = new_object(f"a-{aid}-frame-{k}", box_bm(2.2, 0.5, 2.4, LAWN_TOP + 0.05), col, [mats["brick"] if k == 1 else mats["clay"]])
                o.location = (cx + (k - 1) * 3.2, cy + ((k % 2) - 0.5) * 2.5, 0)
                o.rotation_euler.z = 0.35 * k
        elif kind == "fountain":
            ring = poly or _circle(px, py, 6.0)
            new_object(f"a-{aid}-rim", prism_bm(ring, LAWN_TOP - 0.03, LAWN_TOP + 0.55, top_mat=0, side_mat=0), col, [mats["paved"]])
            inner = [(ring_centroid(clean_ring(ring))[0] + (p[0] - ring_centroid(clean_ring(ring))[0]) * 0.82,
                      ring_centroid(clean_ring(ring))[1] + (p[1] - ring_centroid(clean_ring(ring))[1]) * 0.82) for p in clean_ring(ring)]
            new_object(f"a-{aid}-water", prism_bm(inner, LAWN_TOP + 0.4, LAWN_TOP + 0.6, top_mat=0, side_mat=0), col, [mats["water"]])
        elif kind in ("clubhouse", "other") and (poly or aid == "tip-building"):
            if aid == "tip-building":
                plaza = box_bm(30, 22, 0.3, SITE_TOP - 0.02)
                p = new_object(f"a-{aid}-plaza", plaza, col, [mats["paved"]])
                p.location = (px, py, 0)
                ring = [(px - 7, py - 5), (px + 7, py - 5), (px + 7, py + 5), (px - 7, py + 5)]
                floors = 1
            else:
                ring = poly
                floors = 2 if kind == "clubhouse" else 1
            bm = building_bm(ring, SITE_TOP, floors * FLOOR_HEIGHT_M + 0.5, PARAPET_OTHER)
            new_object(f"a-{aid}", bm, col, [mats["clay"], mats["clay-warm"]])
        elif aid == "tip-round-feature":
            new_object(f"a-{aid}-rim", prism_bm(_circle(px, py, 5.5), SITE_TOP - 0.02, SITE_TOP + 0.5, top_mat=0, side_mat=0), col, [mats["paved"]])
            new_object(f"a-{aid}-water", prism_bm(_circle(px, py, 4.6), SITE_TOP + 0.3, SITE_TOP + 0.55, top_mat=0, side_mat=0), col, [mats["water"]])
        elif kind == "playground":
            pass
        elif kind == "security":
            ring = poly or [(px - 1.6, py - 1.6), (px + 1.6, py - 1.6), (px + 1.6, py + 1.6), (px - 1.6, py + 1.6)]
            bm = building_bm(ring, SITE_TOP, 3.0, 0.2) if poly else box_bm(3.2, 3.2, 3.0, SITE_TOP)
            o = new_object(f"a-{aid}", bm, col, [mats["clay"], mats["clay-warm"]])
            if not poly:
                o.location = (px, py, 0)
        else:
            continue
        out.append({"id": aid, "kind": kind, "point": [round(px, 2), round(py, 2)]})
    return out


def _station_pier(name, x, y, col, mats):
    o = new_object(name, box_bm(1.6, 1.6, 5.2, SITE_TOP), col, [mats["brick"]])
    cap = new_object(f"{name}-cap", box_bm(2.1, 2.1, 0.35, SITE_TOP + 5.2), col, [mats["clay"]])
    for obj in (o, cap):
        obj.location = (x, y, 0)


def build_entries(plan, frame: Frame, mats, col):
    """Brick-red pillars either side of the main entry road, smaller clay ones at the row-house entry."""
    blvd = next(r for r in plan["roads"] if r["id"] == "boulevard-40ft")
    half = blvd["widthM"] / 2 + 1.6
    ex, ey = frame.xy(next(e for e in plan["entries"] if e["id"] == "main-entry")["point"])
    ex -= 4.0  # just inside the highway verge
    _station_pier("entry-pier-n", ex, ey + half, col, mats)
    _station_pier("entry-pier-s", ex, ey - half, col, mats)
    spine = next(r for r in plan["roads"] if r["id"] == "spine-30ft")
    rx, ry = frame.xy(next(e for e in plan["entries"] if e["id"] == "rowhouse-entry")["point"])
    half2 = spine["widthM"] / 2 + 1.2
    for sign, tag in ((1, "n"), (-1, "s")):
        o = new_object(f"rowhouse-pier-{tag}", box_bm(1.2, 1.2, 3.4, SITE_TOP), col, [mats["clay"]])
        cap = new_object(f"rowhouse-pier-{tag}-cap", box_bm(1.5, 1.5, 0.3, SITE_TOP + 3.4), col, [mats["brick"]])
        for obj in (o, cap):
            obj.location = (rx, ry + sign * half2, 0)


def _tree_prototypes(mats, col):
    protos = []
    for kind in ("round", "cone"):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=5, radius1=0.28, radius2=0.2, depth=2.0,
                              matrix=Matrix.Translation((0, 0, 1.0)))
        trunk_faces = list(bm.faces)
        for f in trunk_faces:
            f.material_index = 1
        if kind == "round":
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=2.1, matrix=Matrix.Translation((0, 0, 3.6)))
        else:
            bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=7, radius1=2.0, radius2=0.1, depth=5.2,
                                  matrix=Matrix.Translation((0, 0, 4.2)))
        mesh = bpy.data.meshes.new(f"tree-{kind}")
        bm.to_mesh(mesh)
        bm.free()
        mesh.materials.append(mats["tree"])
        mesh.materials.append(mats["trunk"])
        protos.append(mesh)
    return protos


def build_trees(plan, frame: Frame, mats, col, keep_out_rings, road_lines, max_trees=420):
    protos = _tree_prototypes(mats, col)
    rng = seeded(7)
    building_rings = [clean_ring(frame.pts(b["polygon"])) for b in plan["buildings"]]
    count = 0
    placed = []
    spacing = 5.2
    for g in plan["gardens"]:
        ring = clean_ring(frame.pts(g["polygon"]))
        xs, ys = [p[0] for p in ring], [p[1] for p in ring]
        x = min(xs)
        while x <= max(xs):
            y = min(ys)
            while y <= max(ys):
                px, py = x + rng.uniform(-1.6, 1.6), y + rng.uniform(-1.6, 1.6)
                ok = point_in_ring((px, py), ring) and _edge_distance((px, py), ring) > 1.8
                ok = ok and not any(point_in_ring((px, py), r) for r in building_rings + keep_out_rings)
                ok = ok and all(math.hypot(px - qx, py - qy) > 4.0 for qx, qy in placed)
                ok = ok and count < max_trees
                if ok:
                    mesh = protos[0] if rng.random() < 0.72 else protos[1]
                    o = bpy.data.objects.new(f"tree-{count:03d}", mesh)
                    s = rng.uniform(0.75, 1.3)
                    o.scale = (s, s, s * rng.uniform(0.9, 1.15))
                    o.rotation_euler.z = rng.uniform(0, math.tau)
                    o.location = (px, py, LAWN_TOP)
                    col.objects.link(o)
                    placed.append((px, py))
                    count += 1
                y += spacing
            x += spacing
    return count


def _edge_distance(pt, ring) -> float:
    best = 1e9
    for i in range(len(ring)):
        ax, ay = ring[i]
        bx, by = ring[(i + 1) % len(ring)]
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / (dx * dx + dy * dy + 1e-12)))
        best = min(best, math.hypot(pt[0] - (ax + dx * t), pt[1] - (ay + dy * t)))
    return best


def build_cars(plan, frame: Frame, mats, col, roundabout, count=26):
    """A few block cars on the carriageways, kept clear of junctions and the roundabout."""
    rng = seeded(11)
    lines = [(r, frame.pts(r["centerline"])) for r in plan["roads"]]
    rcx, rcy, rr = roundabout
    body_mats = [mats["car-white"], mats["car-grey"], mats["car-white"], mats["brick"], mats["car-grey"]]
    placed = []
    attempts = 0
    while len(placed) < count and attempts < 4000:
        attempts += 1
        road, line = rng.choice(lines)
        if road["id"].startswith("lane-") and rng.random() < 0.6:
            continue
        p, t = point_along(line, rng.uniform(0.04, 0.96))
        lane = (road["widthM"] if isinstance(road["widthM"], (int, float)) else 6) / 4
        side = rng.choice((-1, 1))
        px, py = p[0] + -t[1] * lane * side, p[1] + t[0] * lane * side
        if math.hypot(px - rcx, py - rcy) < rr + 18:
            continue
        if any(math.hypot(px - qx, py - qy) < 12 for qx, qy in placed):
            continue
        junction = False
        for other, ol in lines:
            if other is road:
                continue
            for i in range(len(ol) - 1):
                if _seg_distance((px, py), ol[i], ol[i + 1]) < (other["widthM"] / 2 + 3.5):
                    junction = True
                    break
            if junction:
                break
        if junction:
            continue
        placed.append((px, py))
        body = new_object(f"car-{len(placed):02d}", box_bm(4.4, 1.9, 0.95, -0.12 + 0.2), col, [rng.choice(body_mats)])
        cabin = new_object(f"car-{len(placed):02d}-cabin", box_bm(2.3, 1.7, 0.7, -0.12 + 0.2 + 0.95), col, [mats["car-white"]])
        ang = math.atan2(t[1], t[0]) + (math.pi if side < 0 else 0)
        for o in (body, cabin):
            o.location = (px, py, 0)
            o.rotation_euler.z = ang
    return len(placed)


def _seg_distance(p, a, b) -> float:
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy + 1e-12)))
    return math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t))
