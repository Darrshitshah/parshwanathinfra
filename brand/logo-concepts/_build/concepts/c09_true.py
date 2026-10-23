"""09 True: a faceted plumb bob on its line, pointing at its mark. Built true and upright; in profile the bob is a cut
jewel, lit from one side (two facets carry the gold in the colour version).
"""
from __future__ import annotations

import kit
import lib
from kit import Line

LINE_W = 3.2        # the plumb line, the eyelet and the datum share this weight
GAP = 2.0           # facet joints
EYE_R = 4.6
LINE_TOP, LINE_BOTTOM = 9.0, 33.0
NECK_W, NECK_H = 7.0, 3.2
CROWN_TOP_W, GIRDLE_W = 11.0, 30.0
CROWN_H = 8.0
TIP_Y = 96.0
DATUM_Y, DATUM_W = 102.0, 14.0


FACET_X = 8.6      # where the facet lines cross the girdle (half-distance from the axis)


def _facet_line(p0: tuple, p1: tuple, w: float) -> object:
    return lib.stroke_line(p0[0], p0[1], p1[0], p1[1], w)


def bob(cx: float, gap: float) -> tuple:
    """(dark facets, lit centre facets). Facet lines run from the table corners to the tip and never cross."""
    y0 = LINE_BOTTOM
    neck = lib.rect(cx - NECK_W / 2, y0, NECK_W, NECK_H)
    yc = y0 + NECK_H
    yg = yc + CROWN_H
    crown = lib.poly([(cx - CROWN_TOP_W / 2, yc), (cx + CROWN_TOP_W / 2, yc), (cx + GIRDLE_W / 2, yg),
                      (cx - GIRDLE_W / 2, yg)])
    pavilion = lib.poly([(cx - GIRDLE_W / 2, yg + gap), (cx + GIRDLE_W / 2, yg + gap), (cx, TIP_Y)])
    gem = lib.union(crown, pavilion)
    tip = (cx, TIP_Y + 4.0)
    cuts = []
    for side in (-1, 1):
        top = (cx + side * CROWN_TOP_W / 2, yc - 1.0)
        mid = (cx + side * FACET_X, yg + gap / 2)
        cuts.append(_facet_line(top, mid, gap))
        cuts.append(_facet_line(mid, tip, gap))
    cut = lib.union(*cuts)
    centre = lib.poly([(cx - CROWN_TOP_W / 2, yc - 2), (cx + CROWN_TOP_W / 2, yc - 2),
                       (cx + FACET_X, yg + gap / 2), (cx, TIP_Y + 4.0), (cx - FACET_X, yg + gap / 2)])
    facets = lib.diff(gem, cut)
    lit = lib.inter(facets, centre)
    dark = lib.diff(facets, centre)
    return lib.union(neck, dark), lit


def mark_layers(line_w: float = LINE_W, datum: bool = True) -> list:
    cx = 25.0
    line = lib.rect(cx - line_w / 2, 0, line_w, LINE_BOTTOM + 0.5)
    dark, lit = bob(cx, GAP)
    layers = [("mark", lib.union(line, dark)), ("accent", lit)]
    if datum:
        layers.append(("mark", lib.rect(cx - DATUM_W / 2, DATUM_Y - line_w / 2, DATUM_W, line_w)))
    return layers


def wordmark(cap: float, align: str = "left") -> kit.Block:
    name = kit.set_line(Line("jost", "PARSHWANATH", cap, 0.14, (("wght", 500),)))
    sub = kit.set_line(Line("jost", "INFRA", cap * 0.44, 0.7, (("wght", 500),), role="sub"))
    return kit.stack([name, sub], [cap * 0.55], align=align)


def build() -> dict:
    mark = kit.normalise(mark_layers())
    small = kit.normalise(mark_layers(line_w=5.0, datum=False))
    return {
        "num": "09",
        "slug": "true",
        "name": "True",
        "family": "Symbol",
        "idea": ("A faceted plumb bob on its line, pointing at its mark: the mason's oldest test that a wall is "
                 "upright. Built true, honestly. In profile the bob is a cut jewel; in colour two facets carry the gold."),
        "type_note": "Jost 500, a geometric sans in the Futura tradition (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark(24.0), gap=24),
        "stacked": kit.stacked(mark, wordmark(14.0, "center"), gap=22),
        "icon": kit.square_icon(small, fill=0.88),
        "tile": kit.square_icon(mark, fill=0.66),
        "avatar": kit.square_icon(small, fill=0.6),
    }
