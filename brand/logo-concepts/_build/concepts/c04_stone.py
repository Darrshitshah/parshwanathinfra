"""04 Stone on Stone: a doorway built the oldest Indian way, by corbelling. Courses of stone step inward until a
capstone closes the gap, as in Gujarat's stepwells (vav) and Solanki temples. Foundation and home in one figure.
"""
from __future__ import annotations

import kit
import lib
from kit import Line

WIDTH = 100.0
JOINT = 4.6
# (course height, opening width) from the ground up; the last course is the capstone (opening 0)
COURSES = ((24.0, 38.0), (20.5, 38.0), (17.5, 23.0), (15.0, 8.0), (13.0, 0.0))


def mark_layers() -> list:
    stones = []
    y = sum(h for h, _ in COURSES) + JOINT * (len(COURSES) - 1)
    for h, opening in COURSES:
        y -= h
        if opening <= 0:
            stones.append(lib.rect(0, y, WIDTH, h))
        else:
            side = (WIDTH - opening) / 2
            stones.append(lib.rect(0, y, side, h))
            stones.append(lib.rect(WIDTH - side, y, side, h))
        y -= JOINT
    return [("mark", lib.union(*stones))]


def name_line(cap: float) -> kit.SetLine:
    return kit.set_line(Line("castoro", "PARSHWANATH", cap, 0.11))


def wordmark_h(cap: float) -> kit.Block:
    """INFRA sits on a fine joint line that runs to the end of the name, like a mortar course."""
    name = name_line(cap)
    sub = kit.set_line(Line("castoro", "INFRA", cap * 0.42, 0.42, role="sub"))
    gap = cap * 0.62
    y_sub = cap + gap + sub.cap
    rule_w = cap * 0.05
    rule = kit.hrule(sub.width + cap * 0.45, name.width, y_sub - sub.cap / 2, rule_w)
    layers = [("word", lib.move(name.path, 0, cap)), ("sub", lib.move(sub.path, 0, y_sub)), ("sub", rule)]
    return kit.Block(layers, name.width, y_sub)


def wordmark_s(cap: float) -> kit.Block:
    name = name_line(cap)
    sub = kit.set_line(Line("castoro", "INFRA", cap * 0.42, 0.42, role="sub"))
    gap = cap * 0.62
    y_sub = cap + gap + sub.cap
    rule_w = cap * 0.05
    x_sub = (name.width - sub.width) / 2
    pad = cap * 0.45
    yr = y_sub - sub.cap / 2
    layers = [
        ("word", lib.move(name.path, 0, cap)),
        ("sub", lib.move(sub.path, x_sub, y_sub)),
        ("sub", kit.hrule(0, x_sub - pad, yr, rule_w)),
        ("sub", kit.hrule(x_sub + sub.width + pad, name.width, yr, rule_w)),
    ]
    return kit.Block(layers, name.width, y_sub)


def build() -> dict:
    mark = kit.normalise(mark_layers())
    return {
        "num": "04",
        "slug": "stone-on-stone",
        "name": "Stone on Stone",
        "family": "Architectural mark",
        "idea": ("A doorway built the oldest Indian way: courses of stone step inward until a capstone closes the gap, "
                 "as in Gujarat's stepwells and Solanki temples. Foundation and home in one figure (and Vapi shares "
                 "its name with vapi, the Sanskrit word behind vav, the stepwell)."),
        "type_note": "Castoro Titling, inscriptional capitals (SIL OFL); the fine rule is a mortar joint",
        "mark": kit.framed(mark, 8),
        "horizontal": kit.horizontal(mark, wordmark_h(26.0), gap=34),
        "stacked": kit.stacked(mark, wordmark_s(15.5), gap=28),
        "icon": kit.square_icon(mark, fill=0.84),
        "tile": kit.square_icon(mark, fill=0.6),
        "avatar": kit.square_icon(mark, fill=0.5),
    }
