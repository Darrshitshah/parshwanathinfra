"""Type setting, lockups and file writers shared by every concept.

Units: every mark is drawn on its own grid and normalised so its height is MARK_H units. Lockups are built in the
same units. Layers carry a role ("mark", "accent", "word", "sub") so boards can recolour them; the delivered SVG files
are single colour.
"""
from __future__ import annotations

from dataclasses import dataclass

import lib
from lib import Art, move, rect, union, xform

MARK_H = 100.0

INK = "#231a12"          # espresso ink
PAPER = "#f6efe2"        # champagne paper
GOLD = "#a58039"         # site gold (on light)
GOLD_DEEP = "#7a5518"    # deep gold
NIGHT = "#120e0a"        # dark paper
GOLD_NIGHT = "#d9b263"   # warm gold (on dark)
GOLD_SCRIPT = "#ebcf8f"  # gold script (on dark)
JEWEL = "#2f2118"        # dark espresso feature block
MIST = "#e7d7b6"         # calm champagne band

_FONTS: dict = {}


def font(key: str, **variations) -> lib.Font:
    k = (key, tuple(sorted(variations.items())))
    if k not in _FONTS:
        _FONTS[k] = lib.Font(key, dict(variations))
    return _FONTS[k]


def cap_ratio(f: lib.Font) -> float:
    """Cap height per unit of font size."""
    return lib.cap_height(f, 1000.0) / 1000.0


@dataclass(frozen=True)
class Line:
    """One line of a wordmark. cap = cap height in output units, tracking in em."""
    font: str
    text: str
    cap: float
    tracking: float = 0.0
    var: tuple = ()
    role: str = "word"
    features: tuple = ()


@dataclass(frozen=True)
class SetLine:
    path: object
    width: float  # ink width
    cap: float
    role: str


def set_line(line: Line, tracking: float | None = None) -> SetLine:
    """Outline a line with its baseline at y=0 and its ink starting at x=0."""
    f = font(line.font, **dict(line.var))
    size = line.cap / cap_ratio(f)
    tr = line.tracking if tracking is None else tracking
    feats = dict(line.features) if line.features else None
    t = lib.text(f, line.text, size, tr, feats)
    x0, _, x1, _ = t.path.bounds
    return SetLine(move(t.path, -x0, 0), x1 - x0, line.cap, line.role)


def set_to_width(line: Line, width: float) -> SetLine:
    """Letter-space a line so its ink is exactly `width` wide (tracking is linear in the ink width)."""
    a = set_line(line, 0.0)
    b = set_line(line, 0.1)
    per = (b.width - a.width) / 0.1
    tr = (width - a.width) / per if per else 0.0
    return set_line(line, tr)


def hrule(x0: float, x1: float, y: float, w: float) -> object:
    return rect(x0, y - w / 2, x1 - x0, w)


@dataclass(frozen=True)
class Block:
    """Set lines stacked into a block. top = cap top of the first line, bottom = baseline of the last."""
    layers: list
    width: float
    height: float


def stack(lines: list, gaps: list, align: str = "left") -> Block:
    """lines: SetLine or (SetLine, extra_layers) items; gaps[i] = space between baseline i and cap top i+1."""
    width = max(item.width for item in lines)
    layers = []
    y = 0.0
    for i, item in enumerate(lines):
        y += item.cap
        if align == "center":
            dx = (width - item.width) / 2
        elif align == "right":
            dx = width - item.width
        else:
            dx = 0.0
        layers.append((item.role, move(item.path, dx, y)))
        if i < len(gaps) and i < len(lines) - 1:
            y += gaps[i]
    return Block(layers, width, y)


def place(layers: list, dx: float, dy: float, s: float = 1.0) -> list:
    return [(r, xform(p, s, 0, 0, s, dx, dy)) for r, p in layers]


def layers_bounds(layers: list) -> tuple:
    return union(*[p for _, p in layers]).bounds


def normalise(layers: list, height: float = MARK_H) -> list:
    """Scale and move a mark so its ink box starts at (0, 0) and is `height` tall."""
    x0, y0, _, y1 = layers_bounds(layers)
    s = height / (y1 - y0)
    return [(r, xform(p, s, 0, 0, s, -x0 * s, -y0 * s)) for r, p in layers]


def framed(layers: list, pad: float) -> Art:
    x0, y0, x1, y1 = layers_bounds(layers)
    return Art(layers, (x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad))


def square_icon(layers: list, fill: float = 0.86, size: float = 100.0, nudge: tuple = (0.0, 0.0)) -> Art:
    """Centre a mark in a square (favicon and avatar artwork). fill = share of the square used by the longer side."""
    x0, y0, x1, y1 = layers_bounds(layers)
    w, h = x1 - x0, y1 - y0
    s = fill * size / max(w, h)
    dx = (size - w * s) / 2 - x0 * s + nudge[0] * size
    dy = (size - h * s) / 2 - y0 * s + nudge[1] * size
    return Art(place(layers, dx, dy, s), (0.0, 0.0, size, size))


def horizontal(mark: list, block: Block, gap: float, block_scale: float = 1.0, dy: float = 0.0,
               pad: float | None = None) -> Art:
    """Mark on the left, the block centred on the mark's height (dy nudges it, in units)."""
    x0, y0, x1, y1 = layers_bounds(mark)
    mh = y1 - y0
    bw, bh = block.width * block_scale, block.height * block_scale
    bx = x1 + gap
    by = y0 + (mh - bh) / 2 + dy
    layers = list(mark) + place(block.layers, bx, by, block_scale)
    return framed(layers, mh * 0.12 if pad is None else pad)


def stacked(mark: list, block: Block, gap: float, block_scale: float = 1.0, pad: float | None = None) -> Art:
    """Mark centred above the block."""
    x0, y0, x1, y1 = layers_bounds(mark)
    mw, mh = x1 - x0, y1 - y0
    bw, bh = block.width * block_scale, block.height * block_scale
    cx = x0 + mw / 2
    layers = list(mark) + place(block.layers, cx - bw / 2, y1 + gap, block_scale)
    return framed(layers, mh * 0.12 if pad is None else pad)


# ----------------------------------------------------------------------------------------------- files
def svg_file(art: Art, fill: str, title: str = "Parshwanath Infra") -> str:
    """Single-colour SVG: one compound path, text already outlined."""
    x, y, w, h = art.box
    d = lib.to_d(art.all())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{lib.fmt(x)} {lib.fmt(y)} {lib.fmt(w)} {lib.fmt(h)}" '
            f'role="img" aria-label="{title}"><title>{title}</title><path fill="{fill}" d="{d}"/></svg>\n')


def svg_roles(art: Art) -> str:
    """Inline SVG for boards: one path per role, coloured by CSS classes r-<role>."""
    return lib.svg_inline(art)
