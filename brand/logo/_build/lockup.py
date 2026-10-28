"""Wordmark and lockups for the final logo.

Wordmark: PARSHWANATH in Cormorant Garamond 600 caps, tracked; under it INFRA, smaller and widely tracked, centred
between two fine rules that run to the full width of the name. The rules echo the otla under the arch, so the name
stands on its own threshold. Everything is outlined (no font is needed to open the files).
"""
from __future__ import annotations

from dataclasses import dataclass

import kit
import lib
from kit import Line
from lib import Art

FONT = "cormorant"
WEIGHT = (("wght", 600),)


@dataclass(frozen=True)
class WordSpec:
    cap: float = 34.0          # cap height of PARSHWANATH (mark height = 100)
    tracking: float = 0.08     # PARSHWANATH tracking, em
    sub_ratio: float = 0.42    # INFRA cap height / PARSHWANATH cap height
    sub_tracking: float = 0.5  # INFRA tracking, em
    gap_ratio: float = 0.5     # gap from PARSHWANATH baseline to INFRA cap top, in PARSHWANATH caps
    rule_ratio: float = 0.12   # rule thickness, in INFRA caps
    rule_pad: float = 1.1      # space between a rule and INFRA, in INFRA caps
    rule_y: float = 0.5        # rule centre height above the INFRA baseline, in INFRA caps
    per_glyph: tuple = ()      # optical spacing corrections for PARSHWANATH, em after each glyph


def wordmark(spec: WordSpec, align: str = "left") -> kit.Block:
    f = kit.font(FONT, **dict(WEIGHT))
    size = spec.cap / kit.cap_ratio(f)
    t = lib.text(f, "PARSHWANATH", size, spec.tracking, per_glyph=list(spec.per_glyph) or None)
    x0, _, x1, _ = t.path.bounds
    name = kit.SetLine(lib.move(t.path, -x0, 0), x1 - x0, spec.cap, "word")
    subcap = spec.cap * spec.sub_ratio
    sub = kit.set_line(Line(FONT, "INFRA", subcap, spec.sub_tracking, WEIGHT, role="sub"))
    width = name.width
    sx = (width - sub.width) / 2
    pad = subcap * spec.rule_pad
    rw = subcap * spec.rule_ratio
    ry = -subcap * spec.rule_y
    rules = lib.union(kit.hrule(0, sx - pad, ry, rw), kit.hrule(sx + sub.width + pad, width, ry, rw))
    sub_line = kit.SetLine(lib.union(lib.move(sub.path, sx, 0), rules), width, subcap, "sub")
    return kit.stack([name, sub_line], [spec.cap * spec.gap_ratio], align=align)


def horizontal(mark_layers: list, block: kit.Block, gap: float, top: float, bottom: float,
               pad: float | None = None) -> Art:
    """Mark on the left; the block's cap top sits at `top` and its last baseline at `bottom` (mark units)."""
    x0, y0, x1, y1 = kit.layers_bounds(mark_layers)
    s = (bottom - top) / block.height
    layers = list(mark_layers) + kit.place(block.layers, x1 + gap, top, s)
    return kit.framed(layers, (y1 - y0) * 0.12 if pad is None else pad)


def stacked(mark_layers: list, block: kit.Block, gap: float, width: float, pad: float | None = None) -> Art:
    """Mark centred above the block; the block is scaled to `width` (mark units)."""
    x0, y0, x1, y1 = kit.layers_bounds(mark_layers)
    s = width / block.width
    cx = (x0 + x1) / 2
    layers = list(mark_layers) + kit.place(block.layers, cx - width / 2, y1 + gap, s)
    return kit.framed(layers, (y1 - y0) * 0.12 if pad is None else pad)
