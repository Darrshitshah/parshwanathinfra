"""Cut precise building footprints out of the 2022 CAD sheet and give each one its sheet tag.

Input : the layout plan PDF, src/content/plan/transform.json, tools/pdf/data/traced-geometry.json (Darshit's roof
        traces, used only to say which walls belong together) and tools/pdf/data/tag-overrides.json (hand decisions).
Output: tools/pdf/data/cad-footprints.json, polygons in CAD display points (not render pixels). build-plan.mjs applies
        the transform. Nothing from the title block is read.

Method, per traced footprint P (render px):
  1. P is grown by 6 px and mapped into CAD space; the black wall segments whose midpoint falls inside are collected.
  2. The walls are closed into an outline (buffer +2.0 pt, then -1.5 pt), the largest piece is kept, its exterior ring is
     taken, clipped to the grown P (so a touching neighbour cannot leak in) and simplified by 0.9 pt.
  3. Tags: every tag circle on the sheet (28 text labels plus 5 drawn as graphics, read from the tiles) is assigned to
     the nearest footprint (inside first). Footprints that end up with no tag are merged into the touching footprint
     that has one, or kept untagged.
Re-run when the CAD sheet changes:
  ~/.local/bin/uv run --no-project --python 3.12 --with pymupdf --with shapely --with numpy --with scipy --with pillow \
    python tools/pdf/cad_buildings.py --pdf "<layout-plan.pdf>" --cad-dir _source/cad
"""

import argparse
import json
import math
from pathlib import Path

from shapely import affinity
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
from shapely.strtree import STRtree

from fit_transform import read_pdf

# Tags drawn as graphics (circle with bold text, no text object), read from the 600 dpi tiles.
GRAPHIC_TAGS = {
    "B13": (767.7, 577.0),
    "B14": (663.1, 461.9),
    "B17": (1048.9, 454.0),
    "B18": (1039.8, 560.2),
    "B19": (951.6, 569.9),
}
GROW_PX = 6.0
CLOSE_PT = 6.0
OPEN_PT = 3.0
SIMPLIFY_PT = 3.2
MERGE_PT = 8.0  # wings that share a tag are joined by a closing of this radius (two strips and their stair)


def load_matrix(path):
    return json.loads(Path(path).read_text())["matrix"]


def invert(m):
    a, b, c, d, e, f = m
    det = a * d - b * c
    ia, ib, ic, id_ = d / det, -b / det, -c / det, a / det
    return [ia, ib, ic, id_, -(ia * e + ic * f), -(ib * e + id_ * f)]


def apply_poly(m, poly):
    return affinity.affine_transform(poly, [m[0], m[2], m[1], m[3], m[4], m[5]])


def traced_polygons(path):
    tg = json.loads(Path(path).read_text())
    items = []
    for kind in ("flats", "mixed", "shops"):
        for i, s in enumerate(tg["PJ_B"][kind]):
            n = list(map(float, s.split()))
            items.append((f"{kind}-{i:02d}", kind, Polygon([(n[j], n[j + 1]) for j in range(0, len(n), 2)]).buffer(0)))
    o = tg["PJ_OFFICE"]
    items.append(("office-00", "office", Polygon([(o[0], o[1]), (o[0] + o[2], o[1]), (o[0] + o[2], o[1] + o[3]), (o[0], o[1] + o[3])])))
    return items


def tag_positions(labels):
    tags = {}
    for lab in labels:
        if lab["kind"] == "building-tag" and lab["text"] not in ("C1",):
            tags[lab["text"]] = (lab["bbox"]["cx"], lab["bbox"]["cy"])
    # C1 appears twice on the sheet: keep the one in sector 04 (y < 300); the other sits on the B12 pair (sheet drafting slip)
    for lab in labels:
        if lab["kind"] == "building-tag" and lab["text"] == "C1" and lab["bbox"]["cy"] < 300:
            tags["C1"] = (lab["bbox"]["cx"], lab["bbox"]["cy"])
    tags.update(GRAPHIC_TAGS)
    return tags


def footprint(walls, tree, poly_cad_grown):
    """Solid outline of the walls inside the grown traced polygon, clipped to it. Returns (polygon or None, wall count)."""
    idx = tree.query(poly_cad_grown)
    picked = []
    for i in idx:
        g = walls[int(i)]
        mx, my = g.interpolate(0.5, normalized=True).coords[0]
        if poly_cad_grown.contains(Point(mx, my)):
            picked.append(g)
    if not picked:
        return None, 0
    # Closing with a 6 pt radius: rooms, wall gaps and balcony notches narrower than 12 pt fill in, so a wing becomes one
    # solid whose outline follows the outer walls. Neighbouring wings are kept apart by the clip to the traced polygon.
    closed = unary_union([g.buffer(CLOSE_PT, resolution=3) for g in picked])
    comps = list(closed.geoms) if hasattr(closed, "geoms") else [closed]
    solids = unary_union([Polygon(c.exterior) for c in comps if c.area > 60])
    solid = solids.buffer(-CLOSE_PT + 0.5)  # outline ends 0.5 pt outside the wall centre line
    solid = solid.buffer(-OPEN_PT, join_style=2).buffer(OPEN_PT, join_style=2)  # opening: drop stubs and slivers, keep square corners
    pieces = [p for p in (solid.geoms if hasattr(solid, "geoms") else [solid]) if p.area > 150]
    if not pieces:
        return None, len(picked)
    biggest = max(pieces, key=lambda p: p.area)
    ring = Polygon(biggest.exterior).intersection(poly_cad_grown)
    if ring.geom_type != "Polygon":
        ring = max(ring.geoms, key=lambda p: p.area)
    return ring.simplify(SIMPLIFY_PT), len(picked)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--cad-dir", default="_source/cad")
    ap.add_argument("--transform", default="src/content/plan/transform.json")
    ap.add_argument("--traced", default="tools/pdf/data/traced-geometry.json")
    ap.add_argument("--overrides", default="tools/pdf/data/tag-overrides.json")
    ap.add_argument("--out", default="tools/pdf/data/cad-footprints.json")
    args = ap.parse_args()

    transform = json.loads(Path(args.transform).read_text())
    m = transform["matrix"]
    minv = invert(m)
    metres_per_pt = transform["metresPerCadPt"]
    walls, _, _ = read_pdf(args.pdf)
    tree = STRtree(walls)
    labels = json.loads((Path(args.cad_dir) / "labels.json").read_text())
    tags = tag_positions(labels)
    overrides = json.loads(Path(args.overrides).read_text()) if Path(args.overrides).exists() else {}

    items = []
    for tid, kind, poly_r in traced_polygons(args.traced):
        grown_cad = apply_poly(minv, poly_r.buffer(GROW_PX))
        fp, n = footprint(walls, tree, grown_cad)
        poly_cad = apply_poly(minv, poly_r)
        iou = 0.0 if fp is None else fp.intersection(poly_cad).area / fp.union(poly_cad).area
        items.append({"traced": tid, "kind": kind, "fp": fp, "poly_cad": poly_cad, "walls": n, "iou": iou})
        print(f"{tid:10s} walls {n:5d} iou {iou:.2f}", "" if fp is not None else "NO FOOTPRINT")

    # tag assignment
    assigned = {t: None for t in tags}
    for tag, (x, y) in tags.items():
        if tag in overrides.get("tagToTraced", {}):
            assigned[tag] = overrides["tagToTraced"][tag]
            continue
        p = Point(x, y)
        best = None
        for it in items:
            if it["fp"] is None or it["kind"] == "office":
                continue
            d = 0.0 if it["fp"].buffer(2.0).contains(p) else it["fp"].distance(p)
            if best is None or d < best[0]:
                best = (d, it["traced"])
        assigned[tag] = best[1] if best and best[0] < 30 else None
    for it in items:
        it["tags"] = sorted([t for t, v in assigned.items() if v == it["traced"]], key=lambda t: (t[0], int(t[1:])) if t[1:].isdigit() else (t, 0))

    # merge untagged footprints into the touching tagged one
    for it in items:
        if it["fp"] is None or it["tags"]:
            continue
        target = overrides.get("mergeInto", {}).get(it["traced"])
        if target is None:
            near = [o for o in items if o["tags"] and o["fp"] is not None and o["fp"].distance(it["fp"]) < 4.0 and o["kind"] == it["kind"]]
            target = min(near, key=lambda o: o["fp"].distance(it["fp"]))["traced"] if near else None
        it["mergeInto"] = target

    out = []
    for it in items:
        if it["fp"] is None or it.get("mergeInto"):
            continue
        fp = it["fp"]
        absorbed = [o["traced"] for o in items if o.get("mergeInto") == it["traced"]]
        for o in items:
            if o.get("mergeInto") == it["traced"] and o["fp"] is not None:
                fp = unary_union([fp.buffer(MERGE_PT, join_style=2), o["fp"].buffer(MERGE_PT, join_style=2)]).buffer(-MERGE_PT, join_style=2)
                if fp.geom_type != "Polygon":
                    fp = max(fp.geoms, key=lambda p: p.area)
                fp = fp.simplify(SIMPLIFY_PT)
        out.append(
            {
                "traced": it["traced"],
                "absorbed": absorbed,
                "kind": it["kind"],
                "tags": it["tags"],
                "iou": round(it["iou"], 3),
                "areaM2": round(fp.area * metres_per_pt**2, 1),
                "polygonCad": [[round(x, 2), round(y, 2)] for x, y in list(fp.exterior.coords)[:-1]],
            }
        )
    Path(args.out).write_text(json.dumps({"_about": "CAD footprints in CAD display points, see tools/pdf/cad_buildings.py", "buildings": out}, indent=1) + "\n")
    print(f"wrote {args.out}: {len(out)} buildings")
    untagged = [o["traced"] for o in out if not o["tags"]]
    print("untagged:", untagged)
    print("tags without a building:", [t for t, v in assigned.items() if v is None])


if __name__ == "__main__":
    main()
