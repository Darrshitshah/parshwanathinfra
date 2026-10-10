"""Cut single flat plans out of the 2022 CAD sheet into clean, class-styled SVGs plus a room list.

Input : the layout plan PDF and _source/cad/labels.json (from plan_extract.py).
Output: public/plan/units/<id>.svg   walls, openings and room labels, no inline colours, no title block, no CAD frame
        tools/pdf/data/unit-rooms.json   rooms (name, size as drawn, metres) per unit, read by src/content/units/*.ts

Each unit is a rectangle on the sheet (display points, origin top left, y down). The drawing is every vector item that
touches the rectangle (the sheet frame and the red sector outlines are skipped), shifted to the rectangle origin, so the
viewBox is "0 0 w h" in sheet points. 1 pt = metresPerCadPt (about 0.2846 m) on this sheet; sizes are the labels' own text.

Re-run when the sheet changes (paths and rectangles are listed in UNITS below):
  ~/.local/bin/uv run --no-project --python 3.12 --with pymupdf python tools/pdf/cut_units.py \
    --pdf "<layout-plan.pdf>" --cad-dir _source/cad
"""

import argparse
import json
import re
from pathlib import Path

import pymupdf as fitz

# id -> rectangle (x0, y0, x1, y1) in sheet display points, and label names to leave out (shared shafts).
UNITS = {
    "flat-473": {"rect": (109.5, 438.5, 142.5, 466.0), "skip": set(), "areaLabel": True},
    "flat-large": {"rect": (552.0, 301.2, 588.0, 335.7), "skip": {"O.T.S", '10\'4"X15\'6"'}, "areaLabel": False},
}

COLOR_CLASS = {
    "000000": "u-wall",
    "003fff": "u-opening",
    "ff00ff": "u-edge",
    "b3ffb3": "u-projection",
    "b80000": "u-edge",
}
SKIP_COLORS = {"ff0000"}  # sector and passage outlines, not part of the flat
SIZE_RE = re.compile(r"^(\d+)'(\d+)\"\s*X\s*(\d+)'(\d+)\"$")
GLYPH_PT = 1.6  # magenta items shorter than this are label glyph pieces
MAX_ITEM_PT = 60.0  # longer items are sheet frames, not flat geometry
FT_TO_M = 0.3048


def color_key(c):
    return "".join(f"{round(v * 255):02x}" for v in c) if c else "none"


def norm(r):
    return fitz.Rect(min(r.x0, r.x1), min(r.y0, r.y1), max(r.x0, r.x1), max(r.y0, r.y1))


def item_path(item, m, ox, oy):
    """One drawing item as an SVG path fragment in unit-local points, plus its display bbox."""
    op = item[0]

    def pt(p):
        q = p * m
        return q.x - ox, q.y - oy

    if op == "l":
        a, b = item[1] * m, item[2] * m
        return f"M{a.x - ox:.2f} {a.y - oy:.2f}L{b.x - ox:.2f} {b.y - oy:.2f}", norm(fitz.Rect(a, b))
    if op == "c":
        pts = [p * m for p in item[1:5]]
        bb = norm(fitz.Rect(min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts)))
        (x0, y0), (x1, y1), (x2, y2), (x3, y3) = (pt(p) for p in item[1:5])
        return f"M{x0:.2f} {y0:.2f}C{x1:.2f} {y1:.2f} {x2:.2f} {y2:.2f} {x3:.2f} {y3:.2f}", bb
    if op == "re":
        r = norm(item[1] * m)
        return f"M{r.x0 - ox:.2f} {r.y0 - oy:.2f}H{r.x1 - ox:.2f}V{r.y1 - oy:.2f}H{r.x0 - ox:.2f}Z", r
    if op == "qu":
        q = item[1]
        pts = [p * m for p in (q.ul, q.ur, q.lr, q.ll)]
        bb = norm(fitz.Rect(min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts)))
        return "M" + "L".join(f"{p.x - ox:.2f} {p.y - oy:.2f}" for p in pts) + "Z", bb
    return None, None


def filled_outline(drawing, m, ox, oy):
    """A small filled shape (a projection bar) as its bounding rectangle; CAD fills are drawn as thin line fans."""
    if drawing.get("fill") is None:
        return None
    r = norm(drawing["rect"] * m)
    if max(r.width, r.height) > MAX_ITEM_PT:
        return None
    return f"M{r.x0 - ox:.2f} {r.y0 - oy:.2f}H{r.x1 - ox:.2f}V{r.y1 - oy:.2f}H{r.x0 - ox:.2f}Z"


def to_metres(feet, inches):
    return round((int(feet) + int(inches) / 12) * FT_TO_M, 2)


def parse_size(text):
    """`10'0"X15'4"` -> (width label, length label, width m, length m) or None."""
    found = SIZE_RE.match(text.replace(" ", ""))
    if not found:
        return None
    w_ft, w_in, l_ft, l_in = found.groups()
    return f"{w_ft}'{w_in}\"", f"{l_ft}'{l_in}\"", to_metres(w_ft, w_in), to_metres(l_ft, l_in)


def escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")


def rooms_in_rect(labels, rect, skip):
    inside = [l for l in labels if rect.x0 <= l["bbox"]["cx"] < rect.x1 and rect.y0 <= l["bbox"]["cy"] < rect.y1]
    sizes = [l for l in inside if l["kind"] == "room-size" and parse_size(l["text"])]
    names = [l for l in inside if l["kind"] == "room" and l["text"] not in skip and "WIDE" not in l["text"]]
    notes = [l for l in inside if l["kind"] == "room" and "WIDE" in l["text"]]
    used, rooms = set(), []
    for name in names:
        best = None
        for index, size in enumerate(sizes):
            if index in used:
                continue
            dist = abs(size["bbox"]["cx"] - name["bbox"]["cx"]) + abs(size["bbox"]["cy"] - name["bbox"]["cy"])
            if dist < 4.5 and (best is None or dist < best[0]):
                best = (dist, index)
        if best is None:
            continue
        used.add(best[1])
        width, length, width_m, length_m = parse_size(sizes[best[1]]["text"])
        rooms.append({"name": name["text"], "width": width, "length": length, "widthM": width_m, "lengthM": length_m})
    return rooms, notes, [sizes[i] for i in sorted(used)] + names


def cut_unit(page, labels, uid, spec):
    rect = fitz.Rect(*spec["rect"])
    m = page.rotation_matrix
    ox, oy = rect.x0, rect.y0
    groups = {}
    for drawing in page.get_drawings():
        stroke = color_key(drawing.get("color"))
        fill = color_key(drawing.get("fill"))
        key = stroke if stroke != "none" else fill
        if key in SKIP_COLORS or key == "none":
            continue
        width = round(drawing.get("width") or 0, 2)
        if key == "ff00ff" and drawing.get("fill") is not None:
            continue  # magenta fills are label glyphs
        outline = filled_outline(drawing, m, ox, oy)
        if outline and (norm(drawing["rect"] * m) + (-0.3, -0.3, 0.3, 0.3)).intersects(rect):
            groups.setdefault((COLOR_CLASS.get(key, "u-other"), 0.0, True), []).append(outline)
            continue
        for item in drawing["items"]:
            d, bb = item_path(item, m, ox, oy)
            if not d or not (bb + (-0.3, -0.3, 0.3, 0.3)).intersects(rect) or bb.width > MAX_ITEM_PT or bb.height > MAX_ITEM_PT:
                continue
            if key == "ff00ff" and max(bb.width, bb.height) < GLYPH_PT:
                continue  # the sheet draws some area labels as magenta glyph outlines
            filled = drawing.get("fill") is not None
            groups.setdefault((COLOR_CLASS.get(key, "u-other"), width, filled), []).append(d)
    rooms, notes, _ = rooms_in_rect(labels, rect, spec["skip"])
    w, h = rect.width, rect.height
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" fill="none" stroke="currentColor" role="img">']
    out.append(f"<title>Flat plan {uid}</title>")
    for (cls, width, filled), paths in sorted(groups.items()):
        w_attr = f' stroke-width="{max(width, 0.2):g}"' if not filled else ' stroke="none"'
        fill_attr = ' fill="currentColor"' if filled else ""
        out.append(f'<path class="{cls}"{w_attr}{fill_attr} d="{"".join(paths)}"/>')
    out.append('<g class="u-labels" stroke="none" fill="currentColor" text-anchor="middle" font-size="0.84">')
    for l in labels:
        b = l["bbox"]
        if not (rect.x0 <= b["cx"] < rect.x1 and rect.y0 <= b["cy"] < rect.y1) or l["text"] in spec["skip"]:
            continue
        if l["kind"] == "area" and spec["areaLabel"]:
            out.append(f'<text class="u-area" x="{b["cx"] - ox:.2f}" y="{b["cy"] - oy + 0.3:.2f}">{escape(l["text"].split(".")[0])}</text>')
        elif l["kind"] in ("room", "room-size"):
            cls = "u-size" if l["kind"] == "room-size" else "u-room"
            out.append(f'<text class="{cls}" x="{b["cx"] - ox:.2f}" y="{b["cy"] - oy + 0.3:.2f}">{escape(l["text"])}</text>')
    out.append("</g></svg>")
    sheet_area = next((l["text"].split(".")[0] for l in labels if l["kind"] == "area" and rect.x0 <= l["bbox"]["cx"] < rect.x1 and rect.y0 <= l["bbox"]["cy"] < rect.y1), None) if spec["areaLabel"] else None
    return "\n".join(out), {"rect": list(spec["rect"]), "viewBox": [0, 0, round(w, 2), round(h, 2)], "sheetLabel": sheet_area, "rooms": rooms, "notes": [n["text"] for n in notes]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--cad-dir", default="_source/cad")
    parser.add_argument("--out", default="public/plan/units")
    parser.add_argument("--data", default="tools/pdf/data/unit-rooms.json")
    args = parser.parse_args()
    page = fitz.open(args.pdf)[0]
    labels = json.loads((Path(args.cad_dir) / "labels.json").read_text())
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    data = {}
    for uid, spec in UNITS.items():
        svg, info = cut_unit(page, labels, uid, spec)
        (out_dir / f"{uid}.svg").write_text(svg)
        data[uid] = info
        print(f"{uid}: {len(svg) / 1024:.1f} KB, {len(info['rooms'])} rooms, sheet label {info['sheetLabel']}")
    Path(args.data).write_text(json.dumps(data, indent=1) + "\n")


if __name__ == "__main__":
    main()
