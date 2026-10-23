"""06 Signature: a wordmark in the site hero's own language. PARSHWANATH in condensed high-contrast capitals with
"Infra" written across it in script; where the script crosses the capitals a hairline gap is cut so it works in one
colour. Favicon and stacked lockup use the capital P.
"""
from __future__ import annotations

import kit
import lib
from kit import Line

CAPS_VAR = (("wdth", 87.5), ("wght", 600), ("opsz", 60))
P_VAR = (("wdth", 87.5), ("wght", 600), ("opsz", 60))        # the mark: same cut as the wordmark
P_SMALL = (("wdth", 87.5), ("wght", 700), ("opsz", 18))      # favicon: low optical size, sturdier hairlines
SCRIPT_SIZE = 1.25   # script capital height relative to the caps
SCRIPT_DROP = 0.75   # script baseline below the caps baseline (share of cap height)
SCRIPT_ROT = -4.0    # degrees, as the site hero's script
THICKEN = 0.02       # Pinyon is a fine copperplate: thickened slightly so it survives reduction
HALO = 0.045         # gap cut into the caps around the script


def signature(cap: float) -> list:
    caps = kit.set_line(Line("playfair", "PARSHWANATH", cap, 0.03, CAPS_VAR))
    f = kit.font("pinyon")
    script = lib.text(f, "Infra", cap * SCRIPT_SIZE / kit.cap_ratio(f)).path
    script = lib.union(script, lib.stroke_path(script, cap * THICKEN, join="round", cap="round"))
    _, _, x1, _ = script.bounds
    script = lib.rotate(script, SCRIPT_ROT, x1, 0)
    _, _, x1, _ = script.bounds
    script = lib.move(script, caps.width - x1 + cap * 0.10, cap + cap * SCRIPT_DROP)
    caps_path = lib.move(caps.path, 0, cap)
    halo = lib.union(script, lib.stroke_path(script, cap * HALO * 2, join="round", cap="round"))
    return [("word", lib.diff(caps_path, halo)), ("accent", script)]


def p_mark(var: tuple) -> list:
    p = kit.set_line(Line("playfair", "P", 100.0, 0.0, var))
    return [("mark", p.path)]


def build() -> dict:
    sig = signature(30.0)
    mark = kit.normalise(p_mark(P_VAR))
    small = kit.normalise(p_mark(P_SMALL))
    sig_block = kit.Block(sig, kit.layers_bounds(sig)[2], kit.layers_bounds(sig)[3])
    sig_s = signature(17.0)
    sx0, sy0, sx1, sy1 = kit.layers_bounds(sig_s)
    stacked_block = kit.Block(kit.place(sig_s, -sx0, -sy0), sx1 - sx0, sy1 - sy0)
    return {
        "num": "06",
        "slug": "signature",
        "name": "Signature",
        "family": "Wordmark",
        "idea": ("The site's own voice as a signature: PARSHWANATH in condensed high-contrast capitals with Infra "
                 "written across it in script, as in the home page hero. A hairline gap is cut where they cross, so "
                 "it holds in one colour. The capital P is the favicon."),
        "type_note": "Playfair condensed 600 and Pinyon Script, the site's display and script faces (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.framed(sig, 6),
        "stacked": kit.stacked(mark, stacked_block, gap=22),
        "icon": kit.square_icon(small, fill=0.84),
        "tile": kit.square_icon(mark, fill=0.6),
        "avatar": kit.square_icon(small, fill=0.5),
    }
