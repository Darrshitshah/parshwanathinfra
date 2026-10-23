"""One module per concept; each exposes build() -> dict (see board.board_html for the keys)."""
from __future__ import annotations

import importlib

NAMES = {
    "01": "c01_heart",
    "02": "c02_open_court",
    "03": "c03_township",
    "04": "c04_stone",
    "05": "c05_arch",
    "06": "c06_signature",
    "07": "c07_seal",
    "08": "c08_key",
    "09": "c09_true",
}

REGISTRY = {num: importlib.import_module(f"concepts.{mod}") for num, mod in NAMES.items()}
