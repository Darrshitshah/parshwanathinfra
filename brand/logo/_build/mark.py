"""The final Parshwanath Infra mark: a seven-lobed cusped arch (torana) standing on an otla.

Construction (all units relative to the outer radius R, SVG coordinates, y down):
- Outer: a half circle of radius R on two straight jambs, `rise` below the springline.
- Opening: the jambs' inner edges rise straight to the springline; above it the intrados is a chain of seven circular
  lobes of ONE radius. The five crown lobes bulge outward between six cusps that sit on a circle concentric with the
  arch; the two shoulder lobes are tangent to the jambs at the springline, so the jambs flow into the arch without a
  step. The cusp angles are solved so the shoulders have exactly the crown lobes' radius (seven equal lobes).
- The band is never thinner than `crown` (at the lobe apexes) and is exactly `jamb` at the springline.
- Otla: one slab under the jambs, a small gap above it, overhanging each side.

Nothing figurative: the seven lobes are an abstract canopy, never a depiction.
"""
from __future__ import annotations

import math
import os
import sys
from dataclasses import dataclass

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "logo-concepts", "_build"))

import lib  # noqa: E402


@dataclass(frozen=True)
class ArchParams:
    R: float = 50.0            # outer radius; the outer width is 2R
    jamb: float = 14.0         # jamb thickness (and band thickness at the springline)
    crown: float = 12.5        # band thickness at the lobe apexes
    rise: float = 80.0         # springline to the foot of the jambs
    cusp: float = 0.84         # cusp tips sit on this share of the inner radius (R - jamb)
    lobes: int = 7
    otla_over: float = 8.0     # otla overhang beyond the jambs, each side
    otla_gap: float = 5.0      # gap between the jambs and the otla
    otla: float = 10.5         # otla thickness
    step: tuple | None = None  # optional lower step: (extra overhang each side, thickness)
    fixed_a1: float | None = None  # force the first cusp angle (degrees) instead of solving for equal lobes


def _circle3(p1, p2, p3):
    (x1, y1), (x2, y2), (x3, y3) = p1, p2, p3
    d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
    ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / d
    uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / d
    return ux, uy, math.hypot(x1 - ux, y1 - uy)


def _crown_lobe_radius(rc: float, ra: float, delta: float) -> float:
    """Radius of a crown lobe whose cusps are `delta` radians apart on radius rc and whose apex is at radius ra."""
    half_chord = rc * math.sin(delta / 2)
    sag = ra - rc * math.cos(delta / 2)
    return (half_chord * half_chord + sag * sag) / (2 * sag)


def _shoulder_error(a1: float, p: ArchParams) -> float:
    """Signed error of the shoulder tangency for a first-cusp angle a1 (radians from the springline)."""
    ri = p.R - p.jamb
    ra = p.R - p.crown
    rc = p.cusp * ri
    n_mid = p.lobes - 2
    delta = (math.pi - 2 * a1) / n_mid
    rho = _crown_lobe_radius(rc, ra, delta)
    # Shoulder circle: tangent to x = -ri at the springline, centre (-ri + rho, 0); it must pass through cusp 1.
    cx = -ri + rho
    x1, y1 = -rc * math.cos(a1), rc * math.sin(a1)
    return math.hypot(x1 - cx, y1) - rho


def solve_a1(p: ArchParams) -> float:
    """First cusp angle (radians) giving seven lobes of one radius. Bisection on the shoulder error."""
    if p.fixed_a1 is not None:
        return math.radians(p.fixed_a1)
    lo, hi = math.radians(4.0), math.radians(40.0)
    f_lo, f_hi = _shoulder_error(lo, p), _shoulder_error(hi, p)
    if f_lo * f_hi > 0:
        raise ValueError(f"no equal-lobe solution for {p}: errors {f_lo:.3f}, {f_hi:.3f}")
    for _ in range(80):
        mid = (lo + hi) / 2
        f_mid = _shoulder_error(mid, p)
        if f_lo * f_mid <= 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2


@dataclass(frozen=True)
class Geometry:
    a1: float          # first cusp angle, radians from the springline
    delta: float       # angle between crown cusps
    rho: float         # the one lobe radius
    cusps: tuple       # cusp points (SVG coordinates), left to right, excluding the springline tangent points
    lobe_depth: float  # crown lobe sagitta / chord


def geometry(p: ArchParams, cx: float, cy: float) -> Geometry:
    ri = p.R - p.jamb
    ra = p.R - p.crown
    rc = p.cusp * ri
    a1 = solve_a1(p)
    n_mid = p.lobes - 2
    delta = (math.pi - 2 * a1) / n_mid
    rho = _crown_lobe_radius(rc, ra, delta)
    cusps = []
    for k in range(n_mid + 1):
        a = a1 + k * delta
        cusps.append((cx - rc * math.cos(a), cy - rc * math.sin(a)))
    chord = 2 * rc * math.sin(delta / 2)
    sag = ra - rc * math.cos(delta / 2)
    return Geometry(a1, delta, rho, tuple(cusps), sag / chord)


def _arc_through(b: lib.Builder, p0, p1, apex) -> None:
    ox, oy, r = _circle3(p0, apex, p1)
    a0 = math.degrees(math.atan2(p0[1] - oy, p0[0] - ox))
    a1 = math.degrees(math.atan2(p1[1] - oy, p1[0] - ox))
    am = math.degrees(math.atan2(apex[1] - oy, apex[0] - ox))
    sweep = (a1 - a0) % 360
    if (am - a0) % 360 <= sweep:
        b.A(ox, oy, r, a0, a0 + sweep)
    else:
        b.A(ox, oy, r, a0, a0 - (360 - sweep))


def opening(p: ArchParams, cx: float, cy: float, bottom: float):
    """The doorway: jambs' inner edges, two shoulder lobes and five crown lobes (lobes=0: a plain round arch)."""
    ri = p.R - p.jamb
    ra = p.R - p.crown
    if p.lobes == 0:
        return lib.union(lib.circle(cx, cy, ri), lib.rect(cx - ri, cy, 2 * ri, bottom - cy))
    g = geometry(p, cx, cy)
    b = lib.Builder()
    b.M(cx - ri, bottom).L(cx - ri, cy)
    # Left shoulder: centre on the springline, from the tangent point up to cusp 1.
    sx = cx - ri + g.rho
    c1 = g.cusps[0]
    end = math.degrees(math.atan2(c1[1] - cy, c1[0] - sx)) % 360
    b.A(sx, cy, g.rho, 180, end if end > 180 else end + 360)
    # Crown lobes.
    for k in range(len(g.cusps) - 1):
        a_mid = g.a1 + (k + 0.5) * g.delta
        apex = (cx - ra * math.cos(a_mid), cy - ra * math.sin(a_mid))
        _arc_through(b, g.cusps[k], g.cusps[k + 1], apex)
    # Right shoulder: mirror.
    sx = cx + ri - g.rho
    cn = g.cusps[-1]
    start = math.degrees(math.atan2(cn[1] - cy, cn[0] - sx)) % 360
    b.A(sx, cy, g.rho, start, 360)
    b.L(cx + ri, bottom)
    return b.path()


def arch_layers(p: ArchParams, with_otla: bool = True) -> list:
    """The mark as one layer ('mark'), origin at the outer top-left of the arch."""
    cx, cy = p.R, p.R
    outer = lib.union(lib.circle(cx, cy, p.R), lib.rect(0, cy, 2 * p.R, p.rise))
    hole = opening(p, cx, cy, cy + p.rise + 20)
    shape = lib.diff(outer, hole)
    parts = [shape]
    if with_otla:
        y = cy + p.rise + p.otla_gap
        parts.append(lib.rect(-p.otla_over, y, 2 * p.R + 2 * p.otla_over, p.otla))
        if p.step:
            extra, thick = p.step
            over = p.otla_over + extra
            parts.append(lib.rect(-over, y + p.otla, 2 * p.R + 2 * over, thick))
    return [("mark", lib.union(*parts))]


def describe(p: ArchParams) -> str:
    if p.lobes == 0:
        return "plain arch"
    g = geometry(p, p.R, p.R)
    return (f"a1={math.degrees(g.a1):.2f}deg delta={math.degrees(g.delta):.2f}deg rho={g.rho:.2f} "
            f"depth={g.lobe_depth:.2f}")


# ----------------------------------------------------------------------------------------------- the chosen marks
# Master mark (outer radius 50): use from 32 px tall up (24 px on high-density screens).
MASTER = ArchParams(R=50.0, jamb=15.0, crown=13.5, rise=80.0, cusp=0.88, otla_over=12.0, otla_gap=5.0, otla=11.0)

# Small mark on a 16 unit grid (favicon): heavier band, deeper gap and otla so every edge lands on whole pixels at
# 16 and 32 px. Arch 12 wide (x 2 to 14), top at y 0, springline 6, jamb foot 13, gap 1, otla 14 to 16 (x 1 to 15).
SMALL = ArchParams(R=6.0, jamb=2.0, crown=1.8, rise=7.0, cusp=0.86, otla_over=1.0, otla_gap=1.0, otla=2.0)

# The plainest form for a 16 px raster (no lobes: at 16 px they only blur the crown).
SMALL_PLAIN = ArchParams(R=6.0, jamb=2.0, crown=2.0, rise=7.0, lobes=0, otla_over=1.0, otla_gap=1.0, otla=2.0)


def key_lines(p: ArchParams, height: float = 100.0) -> dict:
    """Key horizontal lines of the mark once normalised to `height` (springline, jamb foot, otla top, ground)."""
    total = p.R + p.rise + p.otla_gap + p.otla
    s = height / total
    return {
        "springline": p.R * s,
        "jamb_foot": (p.R + p.rise) * s,
        "otla_top": (p.R + p.rise + p.otla_gap) * s,
        "ground": height,
        "scale": s,
    }

# The 16 px raster inside a rounded tile (favicon.ico): arch 8 wide (x 4 to 12), top 2, springline 6, jamb foot 11,
# gap 1, otla 12 to 14 (x 3 to 13). Every edge on a whole pixel.
SMALL16 = ArchParams(R=4.0, jamb=2.0, crown=2.0, rise=5.0, lobes=0, otla_over=1.0, otla_gap=1.0, otla=2.0)
