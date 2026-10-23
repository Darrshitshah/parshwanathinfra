"""Builds the final Parshwanath Infra logo files from the geometry in mark.py and lockup.py.

Writes (paths relative to the project folder):
  brand/logo/svg/{mark,horizontal,stacked}-{espresso,gold,champagne,white,warm-gold}.svg  one colour, outlined
  brand/logo/svg/{horizontal,stacked}-duo-{light,dark}.svg                               gold mark, ink name
  brand/logo/svg/favicon.svg, favicon-tile.svg, favicon-plain.svg                         small marks
  brand/logo/_build/out/geometry.json                                                     numbers for the sheet
  src/app/icon.svg                                  the browser tab icon (espresso, warm gold in dark mode)
  brand/logo/_build/out/site-{mark,word}.svg        raw outlines for the site module (export.mjs optimises them)
  brand/logo/_build/out/png-jobs.json               the PNG exports and icons (export.mjs renders them with sharp)

Then `node brand/logo/_build/export.mjs` optimises the SVGs (svgo), writes src/components/ui/logo-data.ts, renders the
PNGs and packs favicon.ico. Usage (from the project folder):
  sh brand/logo-concepts/_build/py.sh brand/logo/_build/build.py && node brand/logo/_build/export.mjs
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import mark  # noqa: E402  (first: it puts brand/logo-concepts/_build on sys.path for kit and lib)
import kit  # noqa: E402
import lib  # noqa: E402
import lockup  # noqa: E402

PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
OUT_SVG = os.path.join(PROJECT, "brand", "logo", "svg")
OUT_DATA = os.path.join(HERE, "out")
APP_ICON = os.path.join(PROJECT, "src", "app", "icon.svg")
OUT_PNG = os.path.join(PROJECT, "brand", "logo", "png")

TITLE = "Parshwanath Infra"

COLOURS = {
    "espresso": "#231a12",   # ink on champagne paper
    "gold": "#a58039",       # site gold, on light grounds
    "champagne": "#f6efe2",  # champagne paper, on espresso and dark grounds
    "white": "#ffffff",      # on photographs and dark grounds where champagne would read yellow
    "warm-gold": "#d9b263",  # the dark theme's gold, on #120e0a and espresso
}
DUO = {
    "light": ("#a58039", "#231a12"),  # gold mark, espresso name
    "dark": ("#d9b263", "#f6efe2"),   # warm gold mark, champagne name
}

# Lockup settings (mark height = 100 units).
WORD = lockup.WordSpec(cap=34.0, tracking=0.08, sub_ratio=0.45, sub_tracking=0.5, gap_ratio=0.45,
                       rule_ratio=0.12, rule_pad=1.1, rule_y=0.5)
H_GAP = 26.0          # mark to name, horizontal lockup
S_WIDTH = 2.8         # stacked: name width as a multiple of the mark's width
S_GAP = 1.0           # stacked: otla to cap top, in cap heights of the name


# ----------------------------------------------------------------------------------------------- geometry
def master_layers() -> list:
    return kit.normalise(mark.arch_layers(mark.MASTER))


def horizontal_art(m: list) -> lib.Art:
    lines = mark.key_lines(mark.MASTER)
    block = lockup.wordmark(WORD)
    return lockup.horizontal(m, block, H_GAP, lines["springline"], lines["ground"], pad=0)


def stacked_art(m: list) -> tuple:
    x0, _, x1, _ = kit.layers_bounds(m)
    block = lockup.wordmark(WORD, align="center")
    width = (x1 - x0) * S_WIDTH
    cap = WORD.cap * width / block.width
    return lockup.stacked(m, block, cap * S_GAP, width, pad=0), cap


def small_art(p: mark.ArchParams, top: float = 0.0) -> lib.Art:
    """A small mark on its 16 unit grid (outer arch from x = 8 - R, top at `top`)."""
    layers = kit.place(mark.arch_layers(p), 8.0 - p.R, top)
    return lib.Art(layers, (0.0, 0.0, 16.0, 16.0))


# ----------------------------------------------------------------------------------------------- svg writers
def _head(box: tuple, extra: str = "") -> str:
    x, y, w, h = box
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{lib.fmt(x)} {lib.fmt(y)} {lib.fmt(w)} {lib.fmt(h)}" '
            f'role="img" aria-label="{TITLE}"{extra}><title>{TITLE}</title>')


def svg_one(art: lib.Art, fill: str) -> str:
    return _head(art.box) + f'<path fill="{fill}" d="{lib.to_d(art.all())}"/></svg>\n'


def svg_duo(art: lib.Art, mark_fill: str, word_fill: str) -> str:
    m = lib.union(*[p for r, p in art.layers if r == "mark"])
    w = lib.union(*[p for r, p in art.layers if r != "mark"])
    return (_head(art.box) + f'<path fill="{mark_fill}" d="{lib.to_d(m)}"/>'
            f'<path fill="{word_fill}" d="{lib.to_d(w)}"/></svg>\n')


def svg_adaptive_icon(art: lib.Art) -> str:
    """Browser tab icon: espresso on light tab strips, warm gold when the browser is dark."""
    style = ("<style>path{fill:#231a12}@media (prefers-color-scheme:dark){path{fill:#d9b263}}</style>")
    return _head(art.box) + style + f'<path d="{lib.to_d(art.all())}"/></svg>\n'


def svg_tile(art: lib.Art, tile: str = "#231a12", fill: str = "#d9b263", radius: float = 3.5,
             fill_share: float = 0.72) -> str:
    """The small mark centred on a rounded espresso tile (apps, profile pictures, favicon.ico)."""
    x0, y0, x1, y1 = art.all().bounds
    s = fill_share * 16 / (y1 - y0)
    dx, dy = 8 - (x0 + x1) / 2 * s, 8 - (y0 + y1) / 2 * s
    body = lib.xform(art.all(), s, 0, 0, s, dx, dy)
    return (_head((0, 0, 16, 16)) + f'<rect width="16" height="16" rx="{radius}" fill="{tile}"/>'
            f'<path fill="{fill}" d="{lib.to_d(body)}"/></svg>\n')


# ----------------------------------------------------------------------------------------------- site data
def site_svgs(m: list, horiz: lib.Art) -> dict:
    """The mark and the wordmark as two SVGs that share the mark's vertical units (both 100 tall)."""
    mx0, my0, mx1, my1 = kit.layers_bounds(m)
    word = lib.union(*[p for r, p in horiz.layers if r != "mark"])
    wx0, _, wx1, _ = word.bounds
    mark_path = lib.move(lib.union(*[p for _, p in m]), -mx0, -my0)
    word_path = lib.move(word, -wx0, -my0)
    out = {}
    for name, path, w in (("mark", mark_path, mx1 - mx0), ("word", word_path, wx1 - wx0)):
        out[name] = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lib.fmt(w)} 100">'
                     f'<path d="{lib.to_d(path)}"/></svg>\n')
    out["gap"] = (wx0 - mx1) / 100
    return out


# ----------------------------------------------------------------------------------------------- png jobs
def _wrap(art: lib.Art, size: tuple, fill: str, bg: str | None, height_share: float, radius: float = 0.0) -> str:
    """The art centred in a canvas of `size` px, `height_share` of the canvas height tall."""
    cw, ch = size
    x0, y0, x1, y1 = art.all().bounds
    s = height_share * ch / (y1 - y0)
    dx, dy = cw / 2 - (x0 + x1) / 2 * s, ch / 2 - (y0 + y1) / 2 * s
    body = lib.xform(art.all(), s, 0, 0, s, dx, dy)
    back = "" if bg is None else f'<rect width="{cw}" height="{ch}" rx="{radius}" fill="{bg}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" width="{cw}" height="{ch}">'
            f'{back}<path fill="{fill}" d="{lib.to_d(body)}"/></svg>')


def png_jobs(mark_art: lib.Art, horiz: lib.Art, stack: lib.Art, small: lib.Art, plain16: lib.Art) -> list:
    """Each job: an SVG file (or inline SVG) rendered to `png` at `width` px (height follows the viewBox)."""
    jobs = []
    for name in COLOURS:
        jobs.append({"svg": os.path.join(OUT_SVG, f"mark-{name}.svg"), "png": f"mark-{name}-1024.png", "height": 1024})
        jobs.append({"svg": os.path.join(OUT_SVG, f"horizontal-{name}.svg"), "png": f"horizontal-{name}-2400.png",
                     "width": 2400})
        jobs.append({"svg": os.path.join(OUT_SVG, f"stacked-{name}.svg"), "png": f"stacked-{name}-1600.png",
                     "width": 1600})
    for name in DUO:
        jobs.append({"svg": os.path.join(OUT_SVG, f"horizontal-duo-{name}.svg"),
                     "png": f"horizontal-duo-{name}-2400.png", "width": 2400})
        jobs.append({"svg": os.path.join(OUT_SVG, f"stacked-duo-{name}.svg"), "png": f"stacked-duo-{name}-1600.png",
                     "width": 1600})
    esp, warm, paper = COLOURS["espresso"], COLOURS["warm-gold"], COLOURS["champagne"]
    icons = [
        ("favicon-16.png", plain16, (16, 16), warm, esp, 0.75, 3.5),
        ("favicon-32.png", small, (32, 32), warm, esp, 0.75, 7),
        ("favicon-48.png", small, (48, 48), warm, esp, 0.75, 10.5),
        ("apple-touch-icon-180.png", mark_art, (180, 180), warm, esp, 0.58, 0),
        ("icon-192.png", mark_art, (192, 192), warm, esp, 0.58, 0),
        ("icon-512.png", mark_art, (512, 512), warm, esp, 0.58, 0),
        ("avatar-espresso-1080.png", mark_art, (1080, 1080), warm, esp, 0.5, 0),
        ("avatar-champagne-1080.png", mark_art, (1080, 1080), esp, paper, 0.5, 0),
    ]
    for png, art, size, fill, bg, share, radius in icons:
        jobs.append({"inline": _wrap(art, size, fill, bg, share, radius), "png": png, "width": size[0]})
    return jobs


# ----------------------------------------------------------------------------------------------- main
def main() -> None:
    os.makedirs(OUT_SVG, exist_ok=True)
    os.makedirs(OUT_DATA, exist_ok=True)
    m = master_layers()
    mark_art = kit.framed(m, 0)
    horiz = horizontal_art(m)
    stack, s_cap = stacked_art(m)
    for name, fill in COLOURS.items():
        for kind, art in (("mark", mark_art), ("horizontal", horiz), ("stacked", stack)):
            with open(os.path.join(OUT_SVG, f"{kind}-{name}.svg"), "w") as fh:
                fh.write(svg_one(art, fill))
    for name, (mf, wf) in DUO.items():
        for kind, art in (("horizontal", horiz), ("stacked", stack)):
            with open(os.path.join(OUT_SVG, f"{kind}-duo-{name}.svg"), "w") as fh:
                fh.write(svg_duo(art, mf, wf))
    small = small_art(mark.SMALL)
    plain = small_art(mark.SMALL_PLAIN)
    plain16 = small_art(mark.SMALL16, top=2.0)
    with open(os.path.join(OUT_SVG, "favicon.svg"), "w") as fh:
        fh.write(svg_adaptive_icon(small))
    with open(os.path.join(OUT_SVG, "favicon-tile.svg"), "w") as fh:
        fh.write(svg_tile(small))
    with open(os.path.join(OUT_SVG, "favicon-tile-plain.svg"), "w") as fh:
        fh.write(svg_tile(plain))
    with open(APP_ICON, "w") as fh:
        fh.write(svg_adaptive_icon(small))
    site = site_svgs(m, horiz)
    for name in ("mark", "word"):
        with open(os.path.join(OUT_DATA, f"site-{name}.svg"), "w") as fh:
            fh.write(site[name])
    with open(os.path.join(OUT_DATA, "png-jobs.json"), "w") as fh:
        json.dump({"out": OUT_PNG, "jobs": png_jobs(mark_art, horiz, stack, small, plain16)}, fh)
    lines = mark.key_lines(mark.MASTER)
    mx0, my0, mx1, my1 = kit.layers_bounds(m)
    geo = {
        "mark": {"width": mx1 - mx0, "height": my1 - my0, **lines,
                 "arch_width": 2 * mark.MASTER.R * lines["scale"], "jamb": mark.MASTER.jamb * lines["scale"]},
        "horizontal": {"box": horiz.box},
        "stacked": {"box": stack.box, "cap": s_cap},
        "describe": mark.describe(mark.MASTER),
        "site_gap": site["gap"],
    }
    with open(os.path.join(OUT_DATA, "geometry.json"), "w") as fh:
        json.dump(geo, fh, indent=1)
    print(json.dumps(geo, indent=1))


if __name__ == "__main__":
    main()
