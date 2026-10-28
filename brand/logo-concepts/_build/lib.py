"""Geometry, text-to-outline and SVG helpers for the Parshwanath Infra logo concepts.

Everything is built as skia-pathops paths (exact bezier booleans) in SVG coordinates (y down). Text is shaped with
HarfBuzz (kerning, variable-font instances) and converted to outlines, so the SVG files need no fonts.
"""
from __future__ import annotations

import math
import os
from dataclasses import dataclass, field

import pathops
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONTS_DIR = os.environ.get(
    "LOGO_FONTS",
    "/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/logo/fonts",
)

FONT_FILES = {
    "playfair": "playfair/Playfair[opsz,wdth,wght].ttf",
    "zalando": "zalandosansexpanded/ZalandoSansExpanded[wght].ttf",
    "pinyon": "pinyonscript/PinyonScript-Regular.ttf",
    "bodoni": "bodonimoda/BodoniModa[opsz,wght].ttf",
    "marcellus": "marcellus/Marcellus-Regular.ttf",
    "cormorant": "cormorantgaramond/CormorantGaramond[wght].ttf",
    "castoro": "castorotitling/CastoroTitling-Regular.ttf",
    "tenor": "tenorsans/TenorSans-Regular.ttf",
    "mona": "monasans/MonaSans[wdth,wght].ttf",
    "jost": "jost/Jost[wght].ttf",
    "notodisplay": "notoserifdisplay/NotoSerifDisplay[wdth,wght].ttf",
    "italiana": "italiana/Italiana-Regular.ttf",
}

KAPPA = 0.5522847498307936


# ----------------------------------------------------------------------------------------------- path basics
def new() -> pathops.Path:
    return pathops.Path()


def union(*paths: pathops.Path) -> pathops.Path:
    out = new()
    for p in paths:
        if p is None:
            continue
        out = pathops.op(out, p, pathops.PathOp.UNION)
    return out


def diff(a: pathops.Path, *bs: pathops.Path) -> pathops.Path:
    out = a
    for b in bs:
        out = pathops.op(out, b, pathops.PathOp.DIFFERENCE)
    return out


def inter(a: pathops.Path, b: pathops.Path) -> pathops.Path:
    return pathops.op(a, b, pathops.PathOp.INTERSECTION)


def xform(p: pathops.Path, a=1.0, b=0.0, c=0.0, d=1.0, e=0.0, f=0.0) -> pathops.Path:
    """Affine transform (SVG matrix order a b c d e f)."""
    out = new()
    pen = TransformPen(out.getPen(), (a, b, c, d, e, f))
    p.draw(pen)
    return out


def move(p: pathops.Path, dx: float, dy: float) -> pathops.Path:
    return xform(p, 1, 0, 0, 1, dx, dy)


def scale(p: pathops.Path, s: float, sy: float | None = None, ox: float = 0.0, oy: float = 0.0) -> pathops.Path:
    sy = s if sy is None else sy
    return xform(p, s, 0, 0, sy, ox - s * ox, oy - sy * oy)


def rotate(p: pathops.Path, deg: float, ox: float = 0.0, oy: float = 0.0) -> pathops.Path:
    r = math.radians(deg)
    c, s = math.cos(r), math.sin(r)
    return xform(p, c, s, -s, c, ox - c * ox + s * oy, oy - s * ox - c * oy)


def mirror_x(p: pathops.Path, axis: float) -> pathops.Path:
    return xform(p, -1, 0, 0, 1, 2 * axis, 0)


def bounds(p: pathops.Path) -> tuple[float, float, float, float]:
    return p.bounds


# ----------------------------------------------------------------------------------------------- primitives
def rect(x: float, y: float, w: float, h: float) -> pathops.Path:
    p = new()
    p.moveTo(x, y)
    p.lineTo(x + w, y)
    p.lineTo(x + w, y + h)
    p.lineTo(x, y + h)
    p.close()
    return p


def poly(points) -> pathops.Path:
    p = new()
    for i, (x, y) in enumerate(points):
        if i == 0:
            p.moveTo(x, y)
        else:
            p.lineTo(x, y)
    p.close()
    return p


def _arc_segments(cx, cy, r, a0, a1):
    """Cubic segments approximating a circular arc from a0 to a1 (radians, SVG angles)."""
    total = a1 - a0
    n = max(1, int(math.ceil(abs(total) / (math.pi / 2) - 1e-9)))
    step = total / n
    k = 4.0 / 3.0 * math.tan(step / 4.0)
    segs = []
    for i in range(n):
        t0 = a0 + i * step
        t1 = t0 + step
        p0 = (cx + r * math.cos(t0), cy + r * math.sin(t0))
        p3 = (cx + r * math.cos(t1), cy + r * math.sin(t1))
        p1 = (p0[0] - k * r * math.sin(t0), p0[1] + k * r * math.cos(t0))
        p2 = (p3[0] + k * r * math.sin(t1), p3[1] - k * r * math.cos(t1))
        segs.append((p1, p2, p3))
    return segs


class Builder:
    """Small pen with arcs, producing a pathops path."""

    def __init__(self):
        self.p = new()
        self.open = False
        self.cur = None

    def M(self, x, y):
        if self.open:
            self.p.close()
        self.p.moveTo(x, y)
        self.open = True
        self.cur = (x, y)
        return self

    def L(self, x, y):
        self.p.lineTo(x, y)
        self.cur = (x, y)
        return self

    def C(self, x1, y1, x2, y2, x, y):
        self.p.cubicTo(x1, y1, x2, y2, x, y)
        self.cur = (x, y)
        return self

    def Q(self, x1, y1, x, y):
        self.p.quadTo(x1, y1, x, y)
        self.cur = (x, y)
        return self

    def A(self, cx, cy, r, a0_deg, a1_deg):
        """Arc around (cx, cy) from angle a0 to a1 (degrees, SVG: 0 = +x, 90 = down). Joins with a line."""
        a0, a1 = math.radians(a0_deg), math.radians(a1_deg)
        sx, sy = cx + r * math.cos(a0), cy + r * math.sin(a0)
        if not self.open:
            self.M(sx, sy)
        else:
            self.L(sx, sy)
        for p1, p2, p3 in _arc_segments(cx, cy, r, a0, a1):
            self.p.cubicTo(*p1, *p2, *p3)
            self.cur = p3
        return self

    def Z(self):
        if self.open:
            self.p.close()
            self.open = False
        return self

    def path(self) -> pathops.Path:
        self.Z()
        return self.p


def circle(cx: float, cy: float, r: float) -> pathops.Path:
    return Builder().A(cx, cy, r, 0, 360).path()


def ellipse(cx, cy, rx, ry) -> pathops.Path:
    return scale(circle(0, 0, 1), rx, ry) if False else xform(circle(0, 0, 1), rx, 0, 0, ry, cx, cy)


def ring(cx, cy, r_out, r_in) -> pathops.Path:
    return diff(circle(cx, cy, r_out), circle(cx, cy, r_in))


def sector(cx, cy, r_out, r_in, a0, a1) -> pathops.Path:
    b = Builder().A(cx, cy, r_out, a0, a1)
    if r_in > 0:
        b.A(cx, cy, r_in, a1, a0)
    else:
        b.L(cx, cy)
    return b.path()


def rrect(x, y, w, h, r) -> pathops.Path:
    r = min(r, w / 2, h / 2)
    b = Builder()
    b.M(x + r, y).L(x + w - r, y).A(x + w - r, y + r, r, -90, 0)
    b.L(x + w, y + h - r).A(x + w - r, y + h - r, r, 0, 90)
    b.L(x + r, y + h).A(x + r, y + h - r, r, 90, 180)
    b.L(x, y + r).A(x + r, y + r, r, 180, 270)
    return b.path()


def stroke_line(x1, y1, x2, y2, w, cap="butt") -> pathops.Path:
    """A straight stroke as a filled path (butt or round caps)."""
    dx, dy = x2 - x1, y2 - y1
    ln = math.hypot(dx, dy)
    nx, ny = -dy / ln * w / 2, dx / ln * w / 2
    p = poly([(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)])
    if cap == "round":
        p = union(p, circle(x1, y1, w / 2), circle(x2, y2, w / 2))
    return p


def stroke_path(p: pathops.Path, w: float, join="miter", cap="butt", miter=4.0) -> pathops.Path:
    """Outline a path's stroke (skia stroker) and simplify it to a fill."""
    q = new()
    p.draw(q.getPen())
    joins = {"miter": pathops.LineJoin.MITER_JOIN, "round": pathops.LineJoin.ROUND_JOIN, "bevel": pathops.LineJoin.BEVEL_JOIN}
    caps = {"butt": pathops.LineCap.BUTT_CAP, "round": pathops.LineCap.ROUND_CAP, "square": pathops.LineCap.SQUARE_CAP}
    q.stroke(w, caps[cap], joins[join], miter)
    q.convertConicsToQuads()
    q.simplify(fix_winding=True)
    return q


def clean(p: pathops.Path) -> pathops.Path:
    q = new()
    p.draw(q.getPen())
    q.simplify(fix_winding=True)
    return q


# ----------------------------------------------------------------------------------------------- text
@dataclass
class Font:
    key: str
    variations: dict = field(default_factory=dict)

    def __post_init__(self):
        path = os.path.join(FONTS_DIR, FONT_FILES[self.key])
        blob = hb.Blob.from_file_path(path)
        self.face = hb.Face(blob)
        self.hbfont = hb.Font(self.face)
        self.upem = self.face.upem
        if self.variations:
            self.hbfont.set_variations(self.variations)

    def shape(self, text: str, features: dict | None = None):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, features or {"kern": True, "liga": True})
        return list(zip(buf.glyph_infos, buf.glyph_positions))

    def glyph_path(self, gid: int, sc: float, x: float, y: float) -> pathops.Path:
        out = new()
        pen = TransformPen(out.getPen(), (sc, 0, 0, -sc, x, y))
        self.hbfont.draw_glyph_with_pen(gid, pen)
        return out


@dataclass
class Text:
    path: pathops.Path
    width: float  # advance width (with tracking, without trailing tracking)
    size: float

    @property
    def ink(self):
        return self.path.bounds


def text(font: Font, s: str, size: float, tracking: float = 0.0, features: dict | None = None,
         x: float = 0.0, y: float = 0.0, per_glyph: list | None = None) -> Text:
    """Shape `s` and return its outline with the baseline at y and the pen starting at x.

    tracking is in em (0.1 = 10 % of the size added after every glyph but the last). per_glyph optionally gives an
    extra advance in em after glyph i (for optical spacing of display words).
    """
    glyphs = font.shape(s, features)
    sc = size / font.upem
    pen_x = 0.0
    parts = new()
    for i, (info, pos) in enumerate(glyphs):
        gx = x + (pen_x + pos.x_offset) * sc
        gy = y - pos.y_offset * sc
        g = font.glyph_path(info.codepoint, sc, gx, gy)
        parts.addPath(g)
        pen_x += pos.x_advance
        if i < len(glyphs) - 1:
            pen_x += tracking * font.upem
            if per_glyph and i < len(per_glyph):
                pen_x += per_glyph[i] * font.upem
    return Text(clean(parts), pen_x * sc, size)


def cap_height(font: Font, size: float) -> float:
    t = text(font, "H", size)
    b = t.path.bounds
    return -b[1]


def x_height(font: Font, size: float) -> float:
    t = text(font, "x", size)
    return -t.path.bounds[1]


def text_on_arc(font: Font, s: str, size: float, cx: float, cy: float, radius: float, center_deg: float,
                tracking: float = 0.0, bottom: bool = False) -> pathops.Path:
    """Glyphs on a circle. Top arc: reads clockwise, glyph tops point out, baseline on `radius`.
    Bottom arc (bottom=True): reads left to right along the bottom, glyph tops point in, baseline on `radius`."""
    glyphs = font.shape(s)
    sc = size / font.upem
    advs = []
    for i, (info, pos) in enumerate(glyphs):
        a = pos.x_advance * sc
        if i < len(glyphs) - 1:
            a += tracking * size
        advs.append(a)
    total = sum(advs) - (tracking * size if glyphs else 0)
    out = new()
    s_pos = 0.0
    for (info, pos), adv in zip(glyphs, advs):
        own = pos.x_advance * sc
        mid = s_pos + own / 2
        off = (mid - total / 2) / radius
        if not bottom:
            theta = math.radians(center_deg) + off
            rot = theta + math.pi / 2
        else:
            theta = math.radians(center_deg) - off
            rot = theta - math.pi / 2
        g = font.glyph_path(info.codepoint, sc, -own / 2, 0)
        c, si = math.cos(rot), math.sin(rot)
        px, py = cx + radius * math.cos(theta), cy + radius * math.sin(theta)
        out.addPath(xform(g, c, si, -si, c, px, py))
        s_pos += adv
    return clean(out)


# ----------------------------------------------------------------------------------------------- svg output
def fmt(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def to_d(p: pathops.Path) -> str:
    pen = SVGPathPen(None, ntos=fmt)
    p.draw(pen)
    return pen.getCommands()


@dataclass
class Art:
    """A logo drawing: named layers (role -> path) inside a box."""
    layers: list  # list of (role, pathops.Path)
    box: tuple  # (x, y, w, h)

    def all(self) -> pathops.Path:
        return union(*[p for _, p in self.layers])


def fit_box(layers, pad: float = 0.0):
    u = union(*[p for _, p in layers])
    x0, y0, x1, y1 = u.bounds
    return (x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad)


def place(layers, dx, dy, s=1.0):
    return [(r, xform(p, s, 0, 0, s, dx, dy)) for r, p in layers]


PALETTE = {
    "ink": "#14261E",       # deep green ink (site forest ink family)
    "espresso": "#2A1D16",
    "ivory": "#F4F0E6",
    "gold_light": "#A5834B",  # antique gold that holds on ivory
    "gold_dark": "#CFAE70",   # champagne gold on dark grounds
    "maroon": "#4C0F27",
    "green": "#12261E",
}


def svg_doc(art: Art, colors: dict | None, title: str = "Parshwanath Infra", default_color: str = PALETTE["ink"],
            px_height: float | None = None) -> str:
    """colors: None = single colour (currentColor). Otherwise role -> hex."""
    x, y, w, h = art.box
    if px_height is None:
        px_height = h
    pw = w * px_height / h
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(x)} {fmt(y)} {fmt(w)} {fmt(h)}" '
            f'width="{fmt(pw)}" height="{fmt(px_height)}" role="img" aria-label="{title}"')
    body = []
    if colors is None:
        head += f' color="{default_color}">'
        d = to_d(art.all())
        body.append(f'<path fill="currentColor" d="{d}"/>')
    else:
        head += ">"
        merged = {}
        order = []
        for role, p in art.layers:
            col = colors.get(role, colors.get("*"))
            if col not in merged:
                merged[col] = []
                order.append(col)
            merged[col].append(p)
        for col in order:
            d = to_d(union(*merged[col]))
            body.append(f'<path fill="{col}" d="{d}"/>')
    return head + f"<title>{title}</title>" + "".join(body) + "</svg>\n"


def svg_inline(art: Art, cls_prefix: str = "") -> str:
    """Inline SVG for the boards: each role gets a CSS class so panels can recolour it."""
    x, y, w, h = art.box
    parts = []
    merged = {}
    order = []
    for role, p in art.layers:
        if role not in merged:
            merged[role] = []
            order.append(role)
        merged[role].append(p)
    for role in order:
        parts.append(f'<path class="r-{role}" d="{to_d(union(*merged[role]))}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(x)} {fmt(y)} {fmt(w)} {fmt(h)}" '
            f'preserveAspectRatio="xMidYMid meet">{"".join(parts)}</svg>')
