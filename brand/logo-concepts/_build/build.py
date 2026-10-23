"""Builds the logo concepts: SVG files per concept, a board per concept (HTML rendered to PNG) and proofs.

Usage (from the project folder, see README "How to resume"):
  $UV python brand/logo-concepts/_build/build.py 01 02      # build and render the given concepts
  $UV python brand/logo-concepts/_build/build.py all
  $UV python brand/logo-concepts/_build/build.py 01 --proof # also render a large proof for review (scratch folder)
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import board  # noqa: E402
import kit  # noqa: E402
from concepts import REGISTRY  # noqa: E402

OUT = os.path.dirname(HERE)
SCRATCH = os.environ.get(
    "LOGO_SCRATCH",
    "/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/logo/work",
)

VARIANTS = (("", kit.INK), ("-gold", kit.GOLD), ("-gold-dark", kit.GOLD_NIGHT))


def write_svgs(c: dict, folder: str) -> list:
    os.makedirs(folder, exist_ok=True)
    written = []
    title = f"Parshwanath Infra · concept {c['num']} {c['name']}"
    for kind in ("mark", "horizontal", "stacked"):
        for suffix, fill in VARIANTS:
            path = os.path.join(folder, f"{kind}{suffix}.svg")
            with open(path, "w") as fh:
                fh.write(kit.svg_file(c[kind], fill, title))
            written.append(path)
    path = os.path.join(folder, "favicon.svg")
    with open(path, "w") as fh:
        fh.write(kit.svg_file(c["icon"], kit.INK, title))
    written.append(path)
    return written


def proof_html(c: dict) -> str:
    """Large proof for design review: mark big, lockups big, small sizes."""
    m = kit.svg_roles(c["mark"]).replace("<svg ", '<svg height="760" ', 1)
    h = kit.svg_roles(c["horizontal"]).replace("<svg ", '<svg width="1500" ', 1)
    s = kit.svg_roles(c["stacked"]).replace("<svg ", '<svg height="700" ', 1)
    return ("<!doctype html><html><head><meta charset='utf-8'><style>body{margin:0;background:#f6efe2;width:1600px}"
            "svg path{fill:#231a12}.d{display:flex;justify-content:center;padding:50px 0;border-bottom:1px solid #0002}"
            "</style></head><body>"
            f"<div class='d'>{m}</div><div class='d'>{h}</div><div class='d'>{s}</div></body></html>")


def render(jobs: list) -> None:
    if not jobs:
        return
    os.makedirs(SCRATCH, exist_ok=True)
    jobs_path = os.path.join(SCRATCH, "jobs.json")
    with open(jobs_path, "w") as fh:
        json.dump(jobs, fh)
    subprocess.run(["node", os.path.join(HERE, "render.mjs"), jobs_path], check=True)


def build(nums: list, proof: bool) -> None:
    os.makedirs(SCRATCH, exist_ok=True)
    jobs = []
    for num in nums:
        module = REGISTRY[num]
        c = module.build()
        folder = os.path.join(OUT, f"{c['num']}-{c['slug']}")
        write_svgs(c, folder)
        html = os.path.join(SCRATCH, f"board-{c['num']}.html")
        with open(html, "w") as fh:
            fh.write(board.board_html(c))
        jobs.append({"html": html, "png": os.path.join(folder, "board.png"), "width": 1600})
        if proof:
            ph = os.path.join(SCRATCH, f"proof-{c['num']}.html")
            with open(ph, "w") as fh:
                fh.write(proof_html(c))
            jobs.append({"html": ph, "png": os.path.join(SCRATCH, f"proof-{c['num']}.png"), "width": 1600})
    render(jobs)


def main(argv: list) -> None:
    proof = "--proof" in argv
    args = [a for a in argv if not a.startswith("--")]
    nums = sorted(REGISTRY) if (not args or args == ["all"]) else [a.zfill(2) for a in args]
    build(nums, proof)


if __name__ == "__main__":
    main(sys.argv[1:])
