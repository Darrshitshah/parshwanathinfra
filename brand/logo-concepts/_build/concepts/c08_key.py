"""08 The Key: the handover key. Its bow is the site's arch frame with a doorway cut through it, so the key and the
door it opens are one figure; the bit is cut with two wards.
"""
from __future__ import annotations

import kit
import lib
from kit import Line

S = 8.0                 # one stroke for the whole key: bow frame, shaft and bit follow it
BOW_W, BOW_H = 40.0, 47.0
SHAFT_LEN = 55.0
BIT_W, BIT_H = 15.0, 18.0
WARD_W, WARD_H = 7.0, 6.0   # the single ward cut into the bit


def arch(x: float, y: float, w: float, h: float) -> object:
    r = w / 2
    return lib.union(lib.circle(x + r, y + r, r), lib.rect(x, y + r, w, h - r))


def mark_layers() -> list:
    cx = BOW_W / 2
    bow = lib.diff(arch(0, 0, BOW_W, BOW_H), arch(S, S, BOW_W - 2 * S, BOW_H - 2 * S))
    end = BOW_H + SHAFT_LEN
    shaft = lib.rect(cx - S / 2, BOW_H - S, S, end - (BOW_H - S))
    bit = lib.rect(cx + S / 2 - 0.5, end - BIT_H, BIT_W + 0.5, BIT_H)
    ward = lib.rect(cx + S / 2 + BIT_W - WARD_W, end - BIT_H + (BIT_H - WARD_H) / 2, WARD_W + 1, WARD_H)
    return [("mark", lib.diff(lib.union(bow, shaft, bit), ward))]


def wordmark(cap: float, align: str = "left") -> kit.Block:
    name = kit.set_line(Line("tenor", "PARSHWANATH", cap, 0.12))
    sub = kit.set_line(Line("tenor", "INFRA", cap * 0.44, 0.62, role="sub"))
    return kit.stack([name, sub], [cap * 0.55], align=align)


def build() -> dict:
    mark = kit.normalise(mark_layers())
    return {
        "num": "08",
        "slug": "the-key",
        "name": "The Key",
        "family": "Pictorial mark",
        "idea": ("The day that matters most to a buyer: handover. The key's bow is the site's arch frame with a "
                 "doorway cut through it, so the key and the door it opens are one figure."),
        "type_note": "Tenor Sans, a humanist sans with classical proportions (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark(25.0), gap=26),
        "stacked": kit.stacked(mark, wordmark(14.5, "center"), gap=22),
        "icon": kit.square_icon(mark, fill=0.86),
        "tile": kit.square_icon(mark, fill=0.62),
        "avatar": kit.square_icon(mark, fill=0.56),
    }
