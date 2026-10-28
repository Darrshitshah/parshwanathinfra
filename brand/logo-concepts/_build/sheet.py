"""Overview sheet: every drawn concept numbered on one portrait page (about 1600 px wide), readable on a phone."""
from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import board  # noqa: E402
import kit  # noqa: E402
from build import SCRATCH, OUT  # noqa: E402
from concepts import REGISTRY  # noqa: E402

PLANNED = {"10": "Monogram"}


def tile(c: dict) -> str:
    m = kit.svg_roles(c["mark"]).replace("<svg ", '<svg width="100%" height="100%" ', 1)
    h = kit.svg_roles(c["horizontal"]).replace("<svg ", '<svg width="100%" height="100%" ', 1)
    return (f"<div class='t'><div class='n'>{c['num']}</div><div class='nm'>{c['name']}</div>"
            f"<div class='m'>{m}</div><div class='h'>{h}</div></div>")


def main() -> None:
    tiles = [tile(REGISTRY[n].build()) for n in sorted(REGISTRY)]
    for num, name in PLANNED.items():
        if num not in REGISTRY:
            tiles.append(f"<div class='t todo'><div class='n'>{num}</div><div class='nm'>{name}</div>"
                         "<div class='m tx'>Not drawn yet</div></div>")
    css = """body{margin:0;width:1600px;background:#f6efe2;color:#231a12;font-family:Label}
    .hd{padding:70px 70px 40px;font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500;font-size:84px;line-height:1}
    .hd small{display:block;font-family:Label;font-size:26px;letter-spacing:.14em;text-transform:uppercase;margin-top:18px;color:#5e5144}
    .g{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #231a1224}
    .t{position:relative;height:680px;border-bottom:1px solid #231a1224;border-right:1px solid #231a1224}
    .n{position:absolute;left:44px;top:30px;font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500;font-size:120px;line-height:1}
    .nm{position:absolute;left:46px;top:156px;font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500;font-size:54px}
    .m{position:absolute;left:300px;right:40px;top:40px;height:380px;display:flex;justify-content:center}
    .h{position:absolute;left:60px;right:60px;bottom:40px;height:150px;display:flex;justify-content:center}
    .tx{align-items:center;font-size:30px;color:#6e6153}
    svg path{fill:#231a12}.r-accent{fill:#a58039}"""
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{board.font_face('Display', 'playfair')}"
            f"{board.font_face('Label', 'zalando')}{css}</style></head><body>"
            "<div class='hd'>Parshwanath Infra<small>Logo concepts · pick a number</small></div>"
            f"<div class='g'>{''.join(tiles)}</div></body></html>")
    os.makedirs(SCRATCH, exist_ok=True)
    path = os.path.join(SCRATCH, "sheet.html")
    with open(path, "w") as fh:
        fh.write(html)
    jobs = os.path.join(SCRATCH, "jobs-sheet.json")
    with open(jobs, "w") as fh:
        json.dump([{"html": path, "png": os.path.join(OUT, "logo-concepts-sheet.png"), "width": 1600}], fh)
    subprocess.run(["node", os.path.join(HERE, "render.mjs"), jobs], check=True)


if __name__ == "__main__":
    main()
