"""Read the Shiv Shiva layout plan PDF at full quality.

The layout plan is a vector AutoCAD plot (1 page, ~90,000 vector paths, ~15,000 text labels).
This script turns it into data the website build can use:

  sheet.json          page size, rotation, metadata, and how to map coordinates
  labels.json         every text label with its position (building tags, plot numbers, roads, rooms, shops, sizes)
  dimensions.json     dimension strings that carry metres, e.g. 93'-2" [28.40], for working out the real scale
  colors.json         vector path counts per stroke colour (CAD layers come through as colours)
  layers/<rgb>.svg    one SVG per stroke colour, in display orientation, for tracing and cleanup
  plan-<dpi>dpi.png   the whole sheet rasterised at the chosen resolution
  tiles/              optional 3 x 3 tiles at --tile-dpi for close reading of small text

All coordinates are in PDF points in DISPLAY orientation (the page carries /Rotate 90, so raw
PyMuPDF coordinates are converted with page.rotation_matrix). Display orientation = the sheet as
printed: compass north up the paper, main road on the left. The aerial render and Darshit's
portfolio plan show it turned 180 degrees (main road on the right).

Usage:
  uv run --python 3.12 --with pymupdf python tools/pdf/plan_extract.py \
      --pdf "/Users/darshit/Darshit's Portfolio/assets/img/source/layout-plan.pdf" --out _source/cad
Options: --dpi 300 (sheet raster), --tiles (also write 3 x 3 tiles), --tile-dpi 600, --no-raster
"""

import argparse
import json
import re
from pathlib import Path

import pymupdf as fitz  # PyMuPDF

BUILDING_TAG = re.compile(r"^(A|BLDG|[BC]\d{1,2})$")
PLOT_NUMBER = re.compile(r"^\d{1,3}$")
AREA = re.compile(r"^\d{3,4}\.\d\d$")
SIZE = re.compile(r"^\d+'\d*(\"|'')?\s*X\s*\d+'\d*(\"|'')?$", re.IGNORECASE)
DIMENSION_METRIC = re.compile(r"^(?P<imperial>[\d'\-\" ]+)\s*\[(?P<metres>\d+(\.\d+)?)\]$")
ROAD = re.compile(r"(WIDE\s+(INTERNAL\s+)?ROA|W I D E)", re.IGNORECASE)
ROOMS = {
    "HALL", "KITCHEN", "DINING", "BEDROOM", "M.BEDROOM", "BATH", "W.C", "TOILET", "WASH", "STORE",
    "VESTIBULE", "KITCHEN/DIN", "HALL/DIN", "PASSAGE", "BALCONY", "OTLA", "O.T.S", "LIFT", "UP", "DN",
}
PRIVATE_HINTS = ("ASHOKBHAI", "BALDANIYA", "SHILPAM", "JIGNESH", "SUMAN", "\\\\", "AUTODESK EDUCATIONAL")


def classify(text):
    t = text.strip()
    if any(h in t.upper() for h in PRIVATE_HINTS):
        return "private-title-block"
    if BUILDING_TAG.match(t):
        return "building-tag"
    if t.upper().startswith("SECTOR"):
        return "sector"
    if t.upper().startswith("SHOP"):
        return "shop"
    if ROAD.search(t):
        return "road"
    if DIMENSION_METRIC.match(t):
        return "dimension"
    if AREA.match(t):
        return "area"
    if SIZE.match(t):
        return "room-size"
    if t.upper() in ROOMS or "WIDE" in t.upper():
        return "room"
    if PLOT_NUMBER.match(t):
        return "number"
    if t.upper() in {"GARDEN", "G A R D E N", "PARK", "PARKING"}:
        return "open-space"
    if t.upper() in {"ENTRY", "SECURITY", "CABIN", "TOILET BLOCK"} or "OFFICE" in t.upper() or t.upper() == "RECEPTION":
        return "facility"
    return "other"


def rect_out(r, page_w, page_h):
    return {
        "x0": round(r.x0, 2), "y0": round(r.y0, 2), "x1": round(r.x1, 2), "y1": round(r.y1, 2),
        "cx": round((r.x0 + r.x1) / 2, 2), "cy": round((r.y0 + r.y1) / 2, 2),
        "u": round(((r.x0 + r.x1) / 2) / page_w, 5), "v": round(((r.y0 + r.y1) / 2) / page_h, 5),
    }


def extract_labels(page, m, page_w, page_h):
    labels = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                text = span["text"].strip()
                if not text:
                    continue
                r = fitz.Rect(span["bbox"]) * m
                dx, dy = line["dir"]
                rot = fitz.Point(dx, dy) * m - fitz.Point(0, 0) * m
                labels.append({
                    "text": text,
                    "kind": classify(text),
                    "size": round(span["size"], 2),
                    "color": f"#{span['color']:06x}",
                    "dir": [round(rot.x, 3), round(rot.y, 3)],
                    "bbox": rect_out(r, page_w, page_h),
                })
    return labels


def color_key(c):
    if not c:
        return "none"
    return "".join(f"{round(v * 255):02x}" for v in c)


def path_d(item_list, m):
    parts = []
    for item in item_list:
        op = item[0]
        if op == "l":
            p0, p1 = item[1] * m, item[2] * m
            parts.append(f"M{p0.x:.1f} {p0.y:.1f}L{p1.x:.1f} {p1.y:.1f}")
        elif op == "c":
            p0, c1, c2, p1 = (p * m for p in item[1:5])
            parts.append(f"M{p0.x:.1f} {p0.y:.1f}C{c1.x:.1f} {c1.y:.1f} {c2.x:.1f} {c2.y:.1f} {p1.x:.1f} {p1.y:.1f}")
        elif op == "re":
            r = item[1] * m
            parts.append(f"M{r.x0:.1f} {r.y0:.1f}H{r.x1:.1f}V{r.y1:.1f}H{r.x0:.1f}Z")
        elif op == "qu":
            q = item[1]
            pts = [p * m for p in (q.ul, q.ur, q.lr, q.ll)]
            parts.append("M" + "L".join(f"{p.x:.1f} {p.y:.1f}" for p in pts) + "Z")
    return "".join(parts)


def extract_layers(page, m, page_w, page_h, out):
    groups = {}
    for d in page.get_drawings():
        key = color_key(d.get("color") or d.get("fill"))
        g = groups.setdefault(key, {"count": 0, "widths": {}, "paths": []})
        g["count"] += 1
        w = round(d.get("width") or 0, 2)
        g["widths"][str(w)] = g["widths"].get(str(w), 0) + 1
        dd = path_d(d["items"], m)
        if dd:
            g["paths"].append((dd, w, d.get("fill") is not None))
    layer_dir = out / "layers"
    layer_dir.mkdir(parents=True, exist_ok=True)
    summary = {}
    for key, g in sorted(groups.items(), key=lambda kv: -kv[1]["count"]):
        stroke = "#" + key if key != "none" else "#888888"
        body = "".join(
            f'<path d="{dd}" fill="{stroke if filled else "none"}" fill-opacity="{0.25 if filled else 0}" '
            f'stroke="{stroke}" stroke-width="{max(w, 0.2)}"/>'
            for dd, w, filled in g["paths"]
        )
        (layer_dir / f"{key}.svg").write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {page_w:.1f} {page_h:.1f}">{body}</svg>'
        )
        summary[stroke] = {"paths": g["count"], "widths": dict(sorted(g["widths"].items(), key=lambda kv: -kv[1])[:6])}
    return summary


def parse_dimensions(labels):
    dims = []
    for lab in labels:
        mt = DIMENSION_METRIC.match(lab["text"])
        if mt:
            dims.append({"text": lab["text"], "metres": float(mt.group("metres")), "bbox": lab["bbox"], "dir": lab["dir"]})
    return dims


def render(page, out, dpi, tiles, tile_dpi):
    pix = page.get_pixmap(dpi=dpi)
    pix.save(out / f"plan-{dpi}dpi.png")
    result = {"sheet": f"plan-{dpi}dpi.png", "px": [pix.width, pix.height]}
    if not tiles:
        return result
    tile_dir = out / "tiles"
    tile_dir.mkdir(parents=True, exist_ok=True)
    disp = page.rect  # display-oriented rect; get_pixmap(clip=...) takes display coordinates
    names = []
    for row in range(3):
        for col in range(3):
            clip_disp = fitz.Rect(
                disp.x0 + disp.width * col / 3, disp.y0 + disp.height * row / 3,
                disp.x0 + disp.width * (col + 1) / 3, disp.y0 + disp.height * (row + 1) / 3,
            )
            tp = page.get_pixmap(dpi=tile_dpi, clip=clip_disp)
            name = f"tile-r{row}c{col}-{tile_dpi}dpi.png"
            tp.save(tile_dir / name)
            names.append({"file": name, "display_clip_pt": [round(v, 1) for v in clip_disp]})
    result["tiles"] = names
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--tiles", action="store_true")
    ap.add_argument("--tile-dpi", type=int, default=600)
    ap.add_argument("--no-raster", action="store_true")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(args.pdf)
    page = doc[0]
    m = page.rotation_matrix
    page_w, page_h = page.rect.width, page.rect.height

    labels = extract_labels(page, m, page_w, page_h)
    public = [lab for lab in labels if lab["kind"] != "private-title-block"]
    (out / "labels.json").write_text(json.dumps(public, indent=1))
    (out / "dimensions.json").write_text(json.dumps(parse_dimensions(public), indent=1))
    colors = extract_layers(page, m, page_w, page_h, out)
    (out / "colors.json").write_text(json.dumps(colors, indent=1))

    raster = {} if args.no_raster else render(page, out, args.dpi, args.tiles, args.tile_dpi)
    kinds = {}
    for lab in public:
        kinds[lab["kind"]] = kinds.get(lab["kind"], 0) + 1
    sheet = {
        "source": args.pdf,
        "pages": doc.page_count,
        "display_size_pt": [round(page_w, 1), round(page_h, 1)],
        "raw_rotation": page.rotation,
        "coordinates": "PDF points, display orientation (rotation applied). Origin top-left, y down.",
        "creator": doc.metadata.get("creator"),
        "drawing_date": "21-03-2022 (title block)",
        "scale_note": "Sheet says NTS. Use dimensions.json (metric values) to derive a working scale.",
        "privacy": "Title block names, firm details, file path and the 'AUTODESK EDUCATIONAL' stamp are excluded from labels.json and must never be published.",
        "label_counts": kinds,
        "raster": raster,
    }
    (out / "sheet.json").write_text(json.dumps(sheet, indent=1))
    print(json.dumps({"labels": len(public), "kinds": kinds, "colors": len(colors), "raster": raster.get("px")}, indent=1))


if __name__ == "__main__":
    main()
