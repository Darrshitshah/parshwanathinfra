"""05 Sheltering Arch (heritage 1): a doorway whose opening is a seven-lobed cusped arch, the torana arch of Gujarat's
Solanki gateways (Modhera, Vadnagar). Seven lobes quietly echo the sheltering canopy of Parshvanatha; nothing figurative.

Construction: eight cusp points on a circle inside the arch (two of them on the springline); each lobe is the circular
arc through two neighbouring cusps that just touches the arch radius at its middle.
"""
from __future__ import annotations

import math

import kit
import lib
from kit import Line

W = 100.0          # outer width
H = 130.0          # outer height of the arch
T = 13.0           # frame thickness at the jambs and lobe crowns
PLINTH = (7.0, 5.5, 10.0)  # otla: overhang each side, gap under the jambs, thickness
LOBES = 7
CUSP_RATIO = 0.80  # cusp points sit at this share of the inner radius


def _circle_through(p1: tuple, p2: tuple, p3: tuple) -> tuple:
    (x1, y1), (x2, y2), (x3, y3) = p1, p2, p3
    d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
    ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / d
    uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / d
    return ux, uy, math.hypot(x1 - ux, y1 - uy)


def _lobe(b: lib.Builder, p0: tuple, p1: tuple, apex: tuple) -> None:
    """Arc from p0 to p1 passing through apex."""
    ox, oy, r = _circle_through(p0, apex, p1)
    a0 = math.degrees(math.atan2(p0[1] - oy, p0[0] - ox))
    a1 = math.degrees(math.atan2(p1[1] - oy, p1[0] - ox))
    am = math.degrees(math.atan2(apex[1] - oy, apex[0] - ox))
    sweep = (a1 - a0) % 360
    if (am - a0) % 360 <= sweep:
        b.A(ox, oy, r, a0, a0 + sweep)
    else:
        b.A(ox, oy, r, a0, a0 - (360 - sweep))


def opening(cx: float, yc: float, ri: float, bottom: float) -> object:
    rc = ri * CUSP_RATIO
    cusps = []
    for k in range(LOBES + 1):
        a = math.radians(180 + k * 180 / LOBES)
        cusps.append((cx + rc * math.cos(a), yc + rc * math.sin(a)))
    cusps[0], cusps[-1] = (cx - ri, yc), (cx + ri, yc)
    b = lib.Builder()
    b.M(cx - ri, bottom).L(*cusps[0])
    for k in range(LOBES):
        if k == 0:
            _shoulder(b, cx - ri, yc, cusps[1], left=True)
        elif k == LOBES - 1:
            _shoulder(b, cx + ri, yc, cusps[k], left=False)
        else:
            mid = math.radians(180 + (k + 0.5) * 180 / LOBES)
            _lobe(b, cusps[k], cusps[k + 1], (cx + ri * math.cos(mid), yc + ri * math.sin(mid)))
    b.L(cx + ri, bottom)
    return b.path()


def _shoulder(b: lib.Builder, jx: float, yc: float, cusp: tuple, left: bool) -> None:
    """Lowest lobe: springs tangent from the jamb (circle centred on the springline) and ends at the cusp."""
    x1, y1 = cusp
    dy = y1 - yc
    ox = (jx * jx - x1 * x1 - dy * dy) / (2 * (jx - x1))
    r = abs(ox - jx)
    ac = math.degrees(math.atan2(y1 - yc, x1 - ox)) % 360
    if left:
        b.A(ox, yc, r, 180, ac if ac > 180 else ac + 360)
    else:
        b.A(ox, yc, r, ac if ac > 180 else ac + 360, 360)


def mark_layers() -> list:
    cx, ro = W / 2, W / 2
    outer = lib.union(lib.circle(cx, ro, ro), lib.rect(0, ro, W, H - ro))
    hole = opening(cx, ro, ro - T, H + 10)
    over, gap, thick = PLINTH
    otla = lib.rect(-over, H + gap, W + 2 * over, thick)
    return [("mark", lib.union(lib.diff(outer, hole), otla))]


def wordmark(cap: float, align: str = "left") -> kit.Block:
    name = kit.set_line(Line("cormorant", "PARSHWANATH", cap, 0.075, (("wght", 600),)))
    sub = kit.set_line(Line("cormorant", "INFRA", cap * 0.42, 0.62, (("wght", 600),), role="sub"))
    return kit.stack([name, sub], [cap * 0.5], align=align)


def build() -> dict:
    mark = kit.normalise(mark_layers())
    return {
        "num": "05",
        "slug": "sheltering-arch",
        "name": "Sheltering Arch",
        "family": "Architectural mark · heritage",
        "idea": ("A doorway whose opening is a seven-lobed cusped arch, the torana arch of Gujarat's Solanki gateways "
                 "at Modhera and Vadnagar, standing on an otla, the raised threshold of a Gujarati home. The seven "
                 "lobes quietly echo the canopy that shelters Parshvanatha: a welcome and a shelter, never a figure."),
        "type_note": "Cormorant Garamond 600 (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark(27.0), gap=30),
        "stacked": kit.stacked(mark, wordmark(15.5, "center"), gap=24),
        "icon": kit.square_icon(mark, fill=0.86),
        "tile": kit.square_icon(mark, fill=0.62),
        "avatar": kit.square_icon(mark, fill=0.54),
    }
