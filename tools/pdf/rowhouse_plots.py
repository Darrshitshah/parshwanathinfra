"""Cut the traced row-house strips into numbered plots (1 to 165) on the render grid.

Input : tools/pdf/data/traced-geometry.json  (Darshit's traced strips PJ_B.rows, render px)
        tools/pdf/data/rowhouse-spec.json     (which column holds which plot numbers, hand-read from the CAD sheet and the photo)
Output: tools/pdf/data/rowhouse-plots.json    (one polygon per plot, render px, plus the numbering source)

Method: every strip is a column (or a slab of two columns). Along its long axis the column is divided into one slice per
plot, from the end nearest the spine road (the "near" end), in equal parts unless the spec gives weights (the odd, larger
plot at the far end of a few columns). Axis-aligned strips are clipped to the traced outline so the stepped far ends
(the site boundary runs diagonally there) keep their shape. Tip slabs are rotated rectangles (minimum rotated rectangle of
the traced outline); a double slab gets two columns with a 10 percent lane between them.

The traced strips are roof outlines on the render, so the plots are positioned where the houses are seen. Everything here
is indicative: the printed sheet photo is low resolution and the strips beyond the 2022 CAD sheet are traced by eye.

Run:  ~/.local/bin/uv run --no-project --python 3.12 --with shapely python tools/pdf/rowhouse_plots.py
"""

import json
import math
from pathlib import Path

from shapely.geometry import Polygon, box

DATA = Path(__file__).parent / "data"
LANE_SHARE = 0.10


def parse_points(text):
    n = list(map(float, text.split()))
    return [(n[i], n[i + 1]) for i in range(0, len(n), 2)]


def slice_edges(count, weights):
    """Cumulative fractions 0..1 for `count` plots; weights default to equal."""
    w = weights or [1.0] * count
    if len(w) != count:
        raise SystemExit(f"weights length {len(w)} != plot count {count}")
    total = sum(w)
    out = [0.0]
    for x in w:
        out.append(out[-1] + x / total)
    return out


def rect_column(col, outline):
    x0, y0, x1, y1 = outline.bounds
    count = abs(col["last"] - col["first"]) + 1
    step = 1 if col["last"] >= col["first"] else -1
    numbers = [col["first"] + step * k for k in range(count)]
    edges = slice_edges(count, col.get("weights"))
    length = y1 - y0
    plots = []
    for k, number in enumerate(numbers):
        if col["near"] == "yMin":
            ya, yb = y0 + edges[k] * length, y0 + edges[k + 1] * length
        else:
            ya, yb = y1 - edges[k + 1] * length, y1 - edges[k] * length
        cell = box(x0, ya, x1, yb)
        clipped = cell.intersection(outline)
        if clipped.is_empty or clipped.geom_type != "Polygon" or clipped.area < 0.4 * cell.area:
            clipped = cell
        plots.append((number, clipped))
    return plots


TIP_ANGLE_DEG = 23.0  # the four tip slabs lean 22 to 25 degrees from the render's vertical; one angle keeps them parallel


def slab_frame(outline, angle_deg=TIP_ANGLE_DEG):
    """Frame of a slab at a fixed lean: unit vectors u (near to far, towards larger y) and v (to the right) and the
    bounding box of the outline in (s along u, w along v) coordinates measured from the origin (0, 0)."""
    t = math.radians(angle_deg)
    u = (-math.sin(t), math.cos(t))
    v = (math.cos(t), math.sin(t))
    ss = [x * u[0] + y * u[1] for x, y in outline.exterior.coords]
    ws = [x * v[0] + y * v[1] for x, y in outline.exterior.coords]
    return u, v, [min(ss), max(ss)], [min(ws), max(ws)]


def to_xy(u, v, s, w):
    return (s * u[0] + w * v[0], s * u[1] + w * v[1])


def slab_cells(spec_col, frame):
    u, v, (s0, s1), (w0, w1) = frame
    width = w1 - w0
    columns = spec_col["columns"]
    double = len(columns) == 2
    gap = LANE_SHARE * width if double else 0.0
    out = []
    for c in columns:
        if c["side"] == "single":
            a, b = w0, w1
        elif c["side"] == "left":
            a, b = w0, w0 + width / 2 - gap / 2
        else:
            a, b = w0 + width / 2 + gap / 2, w1
        count = abs(c["last"] - c["first"]) + 1
        step = 1 if c["last"] >= c["first"] else -1
        edges = slice_edges(count, c.get("weights"))
        for k in range(count):
            sa = s0 + edges[k] * (s1 - s0)
            sb = s0 + edges[k + 1] * (s1 - s0)
            corners = [to_xy(u, v, sa, a), to_xy(u, v, sb, a), to_xy(u, v, sb, b), to_xy(u, v, sa, b)]
            out.append((c["first"] + step * k, Polygon(corners)))
    return out


def main():
    traced = json.loads((DATA / "traced-geometry.json").read_text())
    rows = [Polygon(parse_points(s)).buffer(0) for s in traced["PJ_B"]["rows"]]
    spec = json.loads((DATA / "rowhouse-spec.json").read_text())

    # frames of the tip slabs; the two big slabs share one boundary line so their columns never overlap
    frames = {}
    for col in spec["columns"]:
        if col["kind"] == "slab":
            frames[col["id"]] = slab_frame(rows[col["row"]])
    if "tipB" in frames and "tipC" in frames:
        ub, vb, sb, wb = frames["tipB"]
        uc, vc, sc, wc = frames["tipC"]
        shared = (wb[1] + wc[0]) / 2
        frames["tipB"] = (ub, vb, sb, [wb[0], shared])
        frames["tipC"] = (uc, vc, sc, [shared, wc[1]])

    plots = []
    for col in spec["columns"]:
        if col["kind"] == "rect":
            cells = rect_column(col, rows[col["row"]])
        else:
            cells = slab_cells(col, frames[col["id"]])
        for number, poly in cells:
            plots.append(
                {
                    "number": number,
                    "strip": col["strip"],
                    "column": col["id"],
                    "source": col["source"],
                    "polygon": [[round(x, 1), round(y, 1)] for x, y in list(poly.exterior.coords)[:-1]],
                }
            )
    plots.sort(key=lambda p: p["number"])
    numbers = [p["number"] for p in plots]
    if numbers != list(range(1, 166)):
        missing = sorted(set(range(1, 166)) - set(numbers))
        dupes = sorted({n for n in numbers if numbers.count(n) > 1})
        raise SystemExit(f"plot numbers are not exactly 1 to 165: missing {missing}, duplicated {dupes}")
    (DATA / "rowhouse-plots.json").write_text(
        json.dumps({"_about": "Generated by tools/pdf/rowhouse_plots.py from rowhouse-spec.json and the traced strips.", "plots": plots}, indent=1) + "\n"
    )
    print(f"wrote {len(plots)} plots: north {sum(1 for p in plots if p['number'] <= 52)}, tip {sum(1 for p in plots if 53 <= p['number'] <= 108)}, south {sum(1 for p in plots if p['number'] >= 109)}")


if __name__ == "__main__":
    main()
