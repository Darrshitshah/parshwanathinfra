"""02 Open Court: a P laid out like a site plan. Plots (solid) and streets (the gaps) on a planning grid, with the
counter of the P left open as the court at the centre, the way Vastu keeps the centre of a plot (Brahmasthan) free.
"""
from __future__ import annotations

import kit
import lib
from kit import Line

C = 30.0   # plot (cell) size
G = 5.0    # street (gutter)


def _cell(col: int, row: int) -> tuple:
    return col * (C + G), row * (C + G)


def plot(col: int, row: int, round_corner: str | None = None) -> object:
    """A square plot; round_corner in {tr, br} draws that outer corner as a quarter circle of radius C."""
    x, y = _cell(col, row)
    if round_corner is None:
        return lib.rect(x, y, C, C)
    b = lib.Builder()
    if round_corner == "tr":
        b.M(x, y).A(x, y + C, C, -90, 0).L(x, y + C)
    elif round_corner == "br":
        b.M(x, y).L(x + C, y).A(x, y, C, 0, 90)
    return b.path()


def mark_layers_tall() -> list:
    """3 x 4 grid: stem of four plots, bowl of five, one open court as the counter."""
    plots = [plot(0, r) for r in range(4)]
    plots += [plot(1, 0), plot(2, 0, "tr"), plot(2, 1), plot(1, 2), plot(2, 2, "br")]
    return [("mark", lib.union(*plots))]


def wordmark(cap: float, align: str = "left") -> kit.Block:
    name = kit.set_line(Line("marcellus", "PARSHWANATH", cap, 0.09))
    sub = kit.set_to_width(Line("marcellus", "INFRA", cap * 0.46, 0.0, role="sub"), name.width * 0.42)
    return kit.stack([name, sub], [cap * 0.55], align=align)


def build() -> dict:
    mark = kit.normalise(mark_layers_tall())
    return {
        "num": "02",
        "slug": "open-court",
        "name": "Open Court",
        "family": "Grid lettermark",
        "idea": ("A P laid out like a site plan: nine plots and the streets between them, with the heart of the letter "
                 "left open as a court, the way Vastu keeps the centre of a home free (Brahmasthan)."),
        "type_note": "Marcellus, a flared inscriptional roman (SIL OFL)",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark(27.0), gap=34),
        "stacked": kit.stacked(mark, wordmark(15.0, "center"), gap=28),
        "icon": kit.square_icon(mark, fill=0.84),
        "tile": kit.square_icon(mark, fill=0.62),
        "avatar": kit.square_icon(mark, fill=0.5),
    }

