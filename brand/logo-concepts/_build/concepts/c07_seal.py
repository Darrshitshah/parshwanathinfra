"""07 The Seal (heritage 2): a document seal for allotment letters, receipts and stamps. The name on the upper arc,
VAPI · GUJARAT on the lower, a ring of 23 beads (a quiet nod to the 23rd Tirthankara; a plain ring works as well) and
an eight-direction Vastu compass at the centre: every plan starts from its orientation.
"""
from __future__ import annotations

import math

import kit
import lib
from kit import Line

R = 50.0
OUTER_W = 2.2       # outer ring
INNER_R = 36.8      # inner ring (centre line)
INNER_W = 1.1
BAND_CAP = 5.15     # cap height of the arc lettering
BEADS = 23
BEAD_R = 1.25
BEAD_RING = 32.6
STAR_LONG = 25.0    # cardinal points
STAR_SHORT = 13.5   # intercardinal points
STAR_WAIST = 3.4    # radius of the valleys between points


def compass(cx: float, cy: float, long: float = STAR_LONG, short: float = STAR_SHORT, waist: float = STAR_WAIST,
            eye: float = 1.6) -> object:
    pts = []
    for i in range(16):
        a = math.radians(-90 + i * 22.5)
        if i % 4 == 0:
            r = long
        elif i % 2 == 0:
            r = short
        else:
            r = waist
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    star = lib.poly(pts)
    return lib.diff(star, lib.circle(cx, cy, eye)) if eye else star


def beads(cx: float, cy: float) -> object:
    return lib.union(*[lib.circle(cx + BEAD_RING * math.cos(math.radians(-90 + i * 360 / BEADS)),
                                  cy + BEAD_RING * math.sin(math.radians(-90 + i * 360 / BEADS)), BEAD_R)
                       for i in range(BEADS)])


TOP_SPAN = 168.0     # degrees the name may occupy on the upper arc
BOTTOM_SPAN = 96.0   # degrees for VAPI · GUJARAT


def _arc_text(f, text: str, cap: float, radius: float, span_deg: float, centre_deg: float, bottom: bool) -> object:
    """Set text on an arc, tracked so it fills exactly span_deg at its baseline radius."""
    size = cap / kit.cap_ratio(f)
    plain = lib.text(f, text, size).width
    target = math.radians(span_deg) * radius
    n = len(text) - 1
    tracking = max(0.0, (target - plain) / (n * size))
    return lib.text_on_arc(f, text, size, R, R, radius, centre_deg, tracking=tracking, bottom=bottom)


def lettering(cx: float, cy: float) -> object:
    f = kit.font("zalando", wght=600)
    band_in, band_out = INNER_R + INNER_W / 2, R - OUTER_W
    mid = (band_in + band_out) / 2
    top = _arc_text(f, "PARSHWANATH INFRA", BAND_CAP, mid - BAND_CAP / 2, TOP_SPAN, 270, False)
    bottom = _arc_text(f, "VAPI · GUJARAT", BAND_CAP, mid + BAND_CAP / 2, BOTTOM_SPAN, 90, True)
    marks = []
    for side in (-1, 1):
        x, d = cx + side * mid, 1.25
        marks.append(lib.poly([(x - d, cy), (x, cy - d), (x + d, cy), (x, cy + d)]))
    return lib.union(top, bottom, *marks)


def seal_layers() -> list:
    cx = cy = R
    rings = lib.union(lib.ring(cx, cy, R, R - OUTER_W), lib.ring(cx, cy, INNER_R + INNER_W / 2, INNER_R - INNER_W / 2))
    return [("mark", rings), ("word", lettering(cx, cy)), ("accent", beads(cx, cy)), ("mark", compass(cx, cy))]


def emblem_layers() -> list:
    """Small-size emblem: a solid disc with a bolder compass cut out of it."""
    cx = cy = R
    star = compass(cx, cy, long=40.0, short=22.0, waist=8.6, eye=0)
    return [("mark", lib.diff(lib.circle(cx, cy, R), star))]


def wordmark(cap: float, align: str = "left") -> kit.Block:
    var = (("wdth", 87.5), ("wght", 520))
    name = kit.set_line(Line("notodisplay", "PARSHWANATH", cap, 0.05, var))
    sub = kit.set_line(Line("notodisplay", "INFRA", cap * 0.42, 0.62, var, role="sub"))
    return kit.stack([name, sub], [cap * 0.46], align=align)


def build() -> dict:
    seal = kit.normalise(seal_layers())
    emblem = kit.normalise(emblem_layers())
    return {
        "num": "07",
        "slug": "the-seal",
        "name": "The Seal",
        "family": "Seal · heritage",
        "idea": ("A seal for allotment letters, receipts and stamps: the name on the arcs, a ring of 23 beads (a quiet "
                 "nod to the 23rd Tirthankara) and an eight-direction Vastu compass at the centre, because every good "
                 "plan starts with its orientation."),
        "type_note": "Zalando Sans Expanded 600 on the arcs, Noto Serif Display condensed beside it (SIL OFL)",
        "mark": kit.framed(seal, 6),
        "horizontal": kit.horizontal(seal, wordmark(26.0), gap=30),
        "stacked": kit.stacked(seal, wordmark(14.5, "center"), gap=22),
        "icon": kit.square_icon(emblem, fill=0.9),
        "tile": kit.square_icon(seal, fill=0.8),
        "avatar": kit.square_icon(seal, fill=0.8),
    }
