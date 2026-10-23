"""03 The Township: a square of land cut by Shiv Shiva Township's real roads, at their real angles and positions.

The boulevard and spine (one straight axis), the diagonal and the 20 ft road meet at the roundabout; the four solid
parcels are the land. Drawn from src/content/plan/plan.json. (The boundary outline itself was tested and rejected as a
logo: at logo sizes it reads as an animal or a car; it stays a graphic device, as on the page curtain.)
"""
from __future__ import annotations

import json
import math
import os

import kit
import lib
from kit import Line

PLAN = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src", "content", "plan", "plan.json")
SIDE = 840.0        # tile size in plan pixels
LEFT_SHARE = 0.655  # roundabout sits this far across the tile (it is 69 % across the real site)
MAIN = 46.0         # every road is cut at one width: two widths on one axis read as a drafting error
MINOR = MAIN
RING_OUT = 92.0
ISLAND = 40.0


def load_plan() -> dict:
    with open(os.path.abspath(PLAN)) as fh:
        return json.load(fh)


def road(points: list, width: float) -> object:
    path = lib.new()
    path.moveTo(*points[0])
    for p in points[1:]:
        path.lineTo(*p)
    return lib.stroke_path(path, width, join="miter", cap="butt")


def diagonal_angle(plan: dict) -> float:
    """Mean direction of the diagonal road (degrees, SVG coordinates)."""
    pts = next(r for r in plan["roads"] if r["id"] == "diagonal-40ft")["centerline"]
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    return math.degrees(math.atan2(y1 - y0, x1 - x0))


def mark_layers() -> list:
    plan = load_plan()
    cx, cy = plan["roundabout"]["center"]
    south_x = next(r for r in plan["roads"] if r["id"] == "north-road-20ft")["centerline"][0][0]
    x0, y0 = cx - LEFT_SHARE * SIDE, cy - 0.5 * SIDE
    tile = lib.rect(x0, y0, SIDE, SIDE)
    a = math.radians(diagonal_angle(plan))
    far = 2 * SIDE
    cuts = [
        road([(cx, cy), (x0 + SIDE + 20, cy)], MAIN),
        road([(cx, cy), (x0 - 20, cy)], MINOR),
        road([(cx, cy), (cx + far * math.cos(a), cy + far * math.sin(a))], MAIN),
        road([(south_x, cy), (south_x, y0 + SIDE + 20)], MINOR),
        lib.circle(cx, cy, RING_OUT),
    ]
    land = lib.union(lib.diff(tile, *cuts), lib.circle(cx, cy, ISLAND))
    return [("mark", lib.inter(land, tile))]


def wordmark(cap: float, align: str = "left") -> kit.Block:
    name = kit.set_line(Line("playfair", "PARSHWANATH", cap, 0.035, (("wdth", 87.5), ("wght", 560), ("opsz", 60))))
    sub = kit.set_line(Line("zalando", "INFRA", cap * 0.34, 0.72, (("wght", 600),), role="sub"))
    return kit.stack([name, sub], [cap * 0.42], align=align)


def build() -> dict:
    mark = kit.normalise(mark_layers())
    return {
        "num": "03",
        "slug": "the-township",
        "name": "The Township",
        "family": "Place mark",
        "idea": ("The township's own plan, cropped to a square of land: the boulevard, spine, diagonal and 20 ft road "
                 "meet at the roundabout at their real angles and positions. Every parcel is land, every gap a road."),
        "type_note": "Playfair condensed 560 (the site's display face) and Zalando Sans Expanded 600 (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark(30.0), gap=30),
        "stacked": kit.stacked(mark, wordmark(19.0, "center"), gap=26),
        "icon": kit.square_icon(mark, fill=0.84),
        "tile": kit.square_icon(mark, fill=0.6),
        "avatar": kit.square_icon(mark, fill=0.5),
    }
