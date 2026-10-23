"""01 The Heart: the site's ring-and-dot seal grows a stem and becomes a P.

The stem joins the ring the way an approach road joins a roundabout (on its edge, tangent); the dot is the island.
Heavy monoline so it holds at 32 px.
"""
from __future__ import annotations

import kit
import lib
from kit import Line

H = 100.0      # cap height of the P
W = 14.0       # stroke
R = 31.0       # ring outer radius
DOT = 6.6      # island radius


def mark_layers() -> list:
    cx, cy = R, R
    ring = lib.ring(cx, cy, R, R - W)
    stem = lib.rect(0, cy, W, H - cy)
    return [("mark", lib.union(ring, stem)), ("accent", lib.circle(cx, cy, DOT))]


def wordmark(cap: float, sub_ratio: float = 0.42) -> kit.Block:
    name = kit.set_line(Line("zalando", "PARSHWANATH", cap, 0.05, (("wght", 600),)))
    sub = kit.set_line(Line("zalando", "INFRA", cap * sub_ratio, 0.62, (("wght", 500),), role="sub"))
    return kit.stack([name, sub], [cap * 0.5])


def build() -> dict:
    mark = kit.normalise(mark_layers())
    block_h = wordmark(30.0)
    block_s = wordmark(17.0)
    return {
        "num": "01",
        "slug": "the-heart",
        "name": "The Heart",
        "family": "Lettermark",
        "idea": ("The ring and dot already on the site grow a stem and become a P. The stem meets the ring the way an "
                 "approach road meets a roundabout, the dot is the island at the heart of the township."),
        "type_note": "Zalando Sans Expanded 600 and 500, the site's own label face (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, block_h, gap=36),
        "stacked": kit.stacked(mark, block_s, gap=30),
        "icon": kit.square_icon(mark, fill=0.84),
        "tile": kit.square_icon(mark, fill=0.62),
        "avatar": kit.square_icon(mark, fill=0.52),
    }
