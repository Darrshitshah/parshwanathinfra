"""Fit the CAD -> render-grid transform and write src/content/plan/transform.json.

Why this method: the render (masterplan-topdown-upload.webp, 2000 x 1342) is the 2022 CAD sheet seen from above,
turned 180 degrees, at one near-uniform scale. Ground features such as the roundabout were redrawn by the render artist
(bigger, about 18 px off), so a handful of hand-picked ground points is a poor estimator. Instead the transform is fitted
to what the viewer actually sees: the outer wall lines of every CAD building must sit on the roof edges in the render.

  1. Read the CAD walls (black layer) from the PDF in display orientation (rotation applied), drop the sheet frame
     and title block, and close the wall lines into building outlines (buffer +2.0 pt, then -1.5 pt).
  2. Initial guess: maximise the overlap between the filled CAD outlines and Darshit's traced flat footprints
     (tools/pdf/data/traced-geometry.json) over a similarity (scale, rotation, translation).
  3. Refine: maximise the mean image-edge strength (Sobel magnitude of the render) along all CAD outlines. This is a
     4-parameter similarity (uniform scale, rotation, translation), restarted from perturbed guesses to confirm
     it converges to one optimum.
  4. Control points: the corners of the near-rectangular CAD blocks (outline fill ratio >= 0.70). Each render corner is measured
     independently as the intersection of two edge lines found in the image (edge search of +-8 px around the
     predicted line). Residual = distance between the measured corner and the transform of the CAD corner.
  5. Scale: metres per CAD point from the long dimension lines (magenta layer, label + line through it), cross-checked
     with the 40' and 30' road widths (blue layer). Metres per render pixel = metres per point / pixel scale.

Run (from the project folder, quote the paths):
  ~/.local/bin/uv run --no-project --python 3.12 --with pymupdf --with shapely --with numpy --with scipy --with pillow \
    python tools/pdf/fit_transform.py --pdf "/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.pdf" \
    --render "<path>/masterplan-topdown-upload.webp" --cad-dir _source/cad --out src/content/plan/transform.json

All numbers are indicative (the sheet says NTS). Never publishes the raw sheet: only the fitted numbers are written.
"""

import argparse
import json
import math
import pickle
import random
from pathlib import Path

import numpy as np
import pymupdf as fitz
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import minimize
from shapely import affinity
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

# Sheet specific exclusions (display points): title block, the LAYOUT PLAN box, and anything longer than a building.
MAX_SEGMENT_PT = 250.0
TITLE_BLOCK = (925.0, 715.0)  # centre x > 925 and y > 715
LAYOUT_BOX = ((430.0, 540.0), 750.0)  # centre x in (430, 540) and y > 750
GRID_W, GRID_H = 2000, 1342
RECT_FILL = 0.70  # outline area / bounding box area: the long residential strips have balcony notches, so 0.70 not 0.95


def color_key(c):
    if not c:
        return "none"
    return "#" + "".join(f"{round(v * 255):02x}" for v in c)


def flatten(items, m, steps=8):
    out = []
    for it in items:
        op = it[0]
        if op == "l":
            p0, p1 = it[1] * m, it[2] * m
            out.append(LineString([(p0.x, p0.y), (p1.x, p1.y)]))
        elif op == "c":
            p0, c1, c2, p1 = (p * m for p in it[1:5])
            pts = []
            for i in range(steps + 1):
                t = i / steps
                u = 1 - t
                pts.append(
                    (
                        u**3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t**3 * p1.x,
                        u**3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t**3 * p1.y,
                    )
                )
            out.append(LineString(pts))
        elif op == "re":
            r = it[1] * m
            out.append(LineString([(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1), (r.x0, r.y0)]))
        elif op == "qu":
            q = it[1]
            pts = [p * m for p in (q.ul, q.ur, q.lr, q.ll)]
            out.append(LineString([(p.x, p.y) for p in pts] + [(pts[0].x, pts[0].y)]))
    return out


def keep_segment(g):
    x0, y0, x1, y1 = g.bounds
    if (x1 - x0) > MAX_SEGMENT_PT or (y1 - y0) > MAX_SEGMENT_PT:
        return False
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if cx > TITLE_BLOCK[0] and cy > TITLE_BLOCK[1]:
        return False
    if LAYOUT_BOX[0][0] < cx < LAYOUT_BOX[0][1] and cy > LAYOUT_BOX[1]:
        return False
    return True


def read_pdf(pdf):
    doc = fitz.open(pdf)
    page = doc[0]
    m = page.rotation_matrix
    walls, magenta, blue = [], [], []
    for d in page.get_drawings():
        key = color_key(d.get("color") or d.get("fill"))
        if key == "#000000":
            walls += [g for g in flatten(d["items"], m) if keep_segment(g)]
        elif key == "#ff00ff":
            magenta += flatten(d["items"], m)
        elif key == "#0000ff":
            blue += flatten(d["items"], m)
    return walls, magenta, blue


def closed_outlines(walls):
    buf = unary_union([g.buffer(2.0, resolution=2) for g in walls])
    closed = buf.buffer(-1.5)
    geoms = list(closed.geoms) if hasattr(closed, "geoms") else [closed]
    return sorted((Polygon(g.exterior) for g in geoms if g.area > 1000 and g.bounds[0] < 1050), key=lambda g: -g.area)


def sim_matrix(p):
    s, th, e, f = p
    c, si = math.cos(th), math.sin(th)
    return [s * c, s * si, -s * si, s * c, e, f]


def apply_matrix(m, x, y):
    return m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]


def shapely_apply(m, geom):
    return affinity.affine_transform(geom, [m[0], m[2], m[1], m[3], m[4], m[5]])


def traced_flats(path):
    tg = json.loads(Path(path).read_text())
    polys = []
    for k in ("flats", "mixed", "shops"):
        for s in tg["PJ_B"][k]:
            n = list(map(float, s.split()))
            polys.append(Polygon([(n[i], n[i + 1]) for i in range(0, len(n), 2)]).buffer(0))
    return unary_union(polys)


def initial_guess(outlines, traced_path):
    """Grid of similarity starts, Nelder-Mead on the intersection-over-union with the traced flat footprints."""
    target = traced_flats(traced_path)
    cad = unary_union(outlines)
    best = None
    for s0 in (1.05, 1.12, 1.20):
        for dx in (-30, 0, 30):
            for dy in (-30, 0, 30):
                p0 = [s0, math.pi, 1322 + s0 * 544.2 + dx, 651 + s0 * 413.3 + dy]

                def neg_iou(p):
                    g = shapely_apply(sim_matrix(p), cad)
                    return -g.intersection(target).area / g.union(target).area

                r = minimize(neg_iou, p0, method="Nelder-Mead", options={"xatol": 0.01, "fatol": 1e-5, "maxiter": 600})
                if best is None or r.fun < best.fun:
                    best = r
    return list(best.x), -best.fun


def edge_magnitude(render_path):
    img = np.asarray(Image.open(render_path).convert("L").resize((GRID_W, GRID_H)), dtype=float)
    g = ndi.gaussian_filter(img, 1.2)
    return ndi.gaussian_filter(np.hypot(ndi.sobel(g, axis=1), ndi.sobel(g, axis=0)), 0.8)


def sample_outlines(outlines, step=1.0):
    pts = []
    for poly in outlines:
        ring = poly.exterior
        n = max(int(ring.length / step), 8)
        for i in range(n):
            p = ring.interpolate(i * ring.length / n)
            pts.append((p.x, p.y))
    return np.array(pts)


def edge_score(mag, pts, m):
    x = m[0] * pts[:, 0] + m[2] * pts[:, 1] + m[4]
    y = m[1] * pts[:, 0] + m[3] * pts[:, 1] + m[5]
    return float(ndi.map_coordinates(mag, [y, x], order=1, mode="nearest").mean())


def refine(mag, pts, p0):
    r = minimize(lambda p: -edge_score(mag, pts, sim_matrix(p)), p0, method="Powell", options={"xtol": 1e-5, "ftol": 1e-7, "maxiter": 4000})
    return r.x, -r.fun


def measure_edge(mag, a, b, search=8.0, trim=0.12):
    """Edge line near the segment a-b (render px): offset along the normal with the strongest mean gradient."""
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    u = (b - a) / np.linalg.norm(b - a)
    n = np.array([-u[1], u[0]])
    ts = np.linspace(trim, 1 - trim, 80)
    base = a[None, :] + ts[:, None] * (b - a)[None, :]
    offsets = np.arange(-search, search + 0.001, 0.25)
    scores = []
    for o in offsets:
        p = base + o * n
        scores.append(ndi.map_coordinates(mag, [p[:, 1], p[:, 0]], order=1, mode="nearest").mean())
    scores = np.array(scores)
    k = int(np.argmax(scores))
    off = offsets[k]
    if 0 < k < len(offsets) - 1:  # parabolic refinement
        y0, y1, y2 = scores[k - 1], scores[k], scores[k + 1]
        denom = y0 - 2 * y1 + y2
        if abs(denom) > 1e-9:
            off += 0.25 * 0.5 * (y0 - y2) / denom
    return a + off * n, u  # a point on the measured line and its direction


def intersect(l1, l2):
    (p1, d1), (p2, d2) = l1, l2
    a = np.array([[d1[0], -d2[0]], [d1[1], -d2[1]]])
    t = np.linalg.solve(a, p2 - p1)
    return p1 + t[0] * d1


def control_points(outlines, labels, mag, m):
    tags = [(l["text"], l["bbox"]["cx"], l["bbox"]["cy"]) for l in labels if l["kind"] == "building-tag"]
    rows = []
    for poly in outlines:
        x0, y0, x1, y1 = poly.bounds
        if poly.area / box(x0, y0, x1, y1).area < RECT_FILL or poly.area < 3000:
            continue
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        tag = min(tags, key=lambda t: (t[1] - cx) ** 2 + (t[2] - cy) ** 2)[0]
        cad = {"top-left": (x0, y0), "top-right": (x1, y0), "bottom-right": (x1, y1), "bottom-left": (x0, y1)}
        order = ["top-left", "top-right", "bottom-right", "bottom-left"]
        pred = {k: np.array(apply_matrix(m, *cad[k])) for k in order}
        lines = {}
        for i, k in enumerate(order):
            k2 = order[(i + 1) % 4]
            lines[(k, k2)] = measure_edge(mag, pred[k], pred[k2])
        for i, k in enumerate(order):
            prev = order[(i - 1) % 4]
            nxt = order[(i + 1) % 4]
            meas = intersect(lines[(prev, k)], lines[(k, nxt)])
            res = float(np.linalg.norm(meas - pred[k]))
            rows.append(
                {
                    "name": f"{tag} block, sheet {k.replace('-', ' ')} corner",
                    "cad": [round(cad[k][0], 2), round(cad[k][1], 2)],
                    "render": [round(float(meas[0]), 1), round(float(meas[1]), 1)],
                    "residualPx": round(res, 2),
                }
            )
    if not rows:
        raise SystemExit("No rectangular blocks found for control points: lower RECT_FILL or check the CAD outlines")
    return rows


def metres_per_cad_pt(dimensions, magenta):
    segs = []
    for g in magenta:
        c = list(g.coords)
        if len(c) == 2:
            L = math.dist(c[0], c[1])
            if L > 25:
                segs.append((L, c))
    pairs = []
    for dm in dimensions:
        cx, cy = dm["bbox"]["cx"], dm["bbox"]["cy"]
        horizontal = abs(dm["dir"][0]) > 0.5
        best = None
        for L, c in segs:
            (xa, ya), (xb, yb) = c
            if horizontal and abs(ya - yb) < 0.5 and abs(ya - cy) < 6 and min(xa, xb) - 5 <= cx <= max(xa, xb) + 5:
                best = max(best or (0, None), (L, c))
            if (not horizontal) and abs(xa - xb) < 0.5 and abs(xa - cx) < 6 and min(ya, yb) - 5 <= cy <= max(ya, yb) + 5:
                best = max(best or (0, None), (L, c))
        if best and best[0] > 90:
            pairs.append((dm["text"], dm["metres"], best[0]))
    total_m = sum(p[1] for p in pairs)
    total_pt = sum(p[2] for p in pairs)
    return total_m / total_pt, pairs


def road_cross_check(blue):
    """Widths of the 40 ft and 30 ft internal roads from the long horizontal blue edge lines of the main spine."""
    horizontals = []
    for g in blue:
        c = list(g.coords)
        if len(c) == 2 and abs(c[0][1] - c[1][1]) < 0.01 and abs(c[0][0] - c[1][0]) > 120:
            horizontals.append((round(c[0][1], 1), abs(c[0][0] - c[1][0])))
    return sorted(set(horizontals))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--render", required=True)
    ap.add_argument("--cad-dir", default="_source/cad")
    ap.add_argument("--traced", default="tools/pdf/data/traced-geometry.json")
    ap.add_argument("--out", default="src/content/plan/transform.json")
    ap.add_argument("--cache", default=None, help="optional pickle that skips the slow PDF reading and initial guess on re-runs")
    ap.add_argument("--diagnostics", default=None, help="optional JSON with extra numbers (not committed)")
    args = ap.parse_args()

    cache = Path(args.cache) if args.cache else None
    if cache and cache.exists():
        outlines, magenta, blue, p_init, iou = pickle.loads(cache.read_bytes())
        print(f"loaded cache {cache}")
    else:
        walls, magenta, blue = read_pdf(args.pdf)
        outlines = closed_outlines(walls)
        print(f"{len(walls)} wall segments, {len(outlines)} closed outlines")
        p_init, iou = initial_guess(outlines, args.traced)
        if cache:
            cache.write_bytes(pickle.dumps((outlines, magenta, blue, p_init, iou)))
    print(f"initial similarity from IoU {iou:.3f}: s={p_init[0]:.4f} theta={math.degrees(p_init[1]):.3f} e={p_init[2]:.1f} f={p_init[3]:.1f}")

    mag = edge_magnitude(args.render)
    pts = sample_outlines(outlines)
    p_fit, score = refine(mag, pts, p_init)
    random.seed(7)
    restarts = []
    for _ in range(5):
        pr = [p_fit[0] * (1 + random.uniform(-0.01, 0.01)), p_fit[1] + random.uniform(-0.01, 0.01), p_fit[2] + random.uniform(-8, 8), p_fit[3] + random.uniform(-8, 8)]
        r, sc = refine(mag, pts, pr)
        restarts.append(round(sc, 3))
        if sc > score:
            p_fit, score = r, sc
    print(f"edge score {score:.3f}; restart scores {restarts}")
    m = sim_matrix(p_fit)

    labels = json.loads((Path(args.cad_dir) / "labels.json").read_text())
    dimensions = json.loads((Path(args.cad_dir) / "dimensions.json").read_text())
    rows = control_points(outlines, labels, mag, m)
    res = np.array([r["residualPx"] for r in rows])
    m_per_pt, dim_pairs = metres_per_cad_pt(dimensions, magenta)
    pixel_scale = math.hypot(m[0], m[1])
    out = {
        "from": "cad-display-pt",
        "to": "render-px",
        "matrix": [round(v, 6) for v in m],
        "controlPoints": rows,
        "rmsPx": round(float(np.sqrt((res**2).mean())), 2),
        "maxPx": round(float(res.max()), 2),
        "metresPerCadPt": round(m_per_pt, 4),
        "metresPerRenderPx": round(m_per_pt / pixel_scale, 4),
        "method": "affine",
    }
    Path(args.out).write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k != "controlPoints"}))
    print(f"{len(rows)} control points, rms {out['rmsPx']} px, max {out['maxPx']} px")
    if args.diagnostics:
        diag = {
            "pixelScale": pixel_scale,
            "rotationDeg": math.degrees(p_fit[1]),
            "edgeScore": score,
            "restartScores": restarts,
            "iouInit": iou,
            "dimensionLines": [{"label": t, "metres": mm, "points": round(ll, 2), "mPerPt": round(mm / ll, 4)} for t, mm, ll in dim_pairs],
            "longHorizontalBlueEdges": road_cross_check(blue),
        }
        Path(args.diagnostics).write_text(json.dumps(diag, indent=1))


if __name__ == "__main__":
    main()
