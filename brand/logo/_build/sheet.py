"""Brand sheet: one portrait page, 1600 px wide, readable on a phone: the logo, clear space, minimum sizes, colours,
do and don't. Built from the optimised files in brand/logo/svg (run build.py and export.mjs first).

Usage (from the project folder): sh brand/logo-concepts/_build/py.sh brand/logo/_build/sheet.py
"""
from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import mark  # noqa: E402  (puts brand/logo-concepts/_build on sys.path)
import board  # noqa: E402  (font_face helper)

PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
LOGO = os.path.join(PROJECT, "brand", "logo")
SVG = os.path.join(LOGO, "svg")
RENDER = os.path.join(PROJECT, "brand", "logo-concepts", "_build", "render.mjs")
SCRATCH = os.environ.get(
    "LOGO_SCRATCH",
    "/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/brand/work",
)
PHOTO = os.path.join(PROJECT, "public", "media", "cover.webp")


def svg(name: str, style: str = "") -> str:
    """Inline one of the brand SVGs (title removed so the sheet shows no tooltips)."""
    with open(os.path.join(SVG, name)) as fh:
        s = fh.read().strip()
    s = re.sub(r"<title>.*?</title>", "", s)
    return s.replace("<svg ", f'<svg style="display:block;{style}" ', 1)


def photo_uri() -> str:
    jpg = os.path.join(SCRATCH, "sheet-photo.jpg")
    if not os.path.exists(jpg):
        subprocess.run(["sips", "-s", "format", "jpeg", "-Z", "900", PHOTO, "--out", jpg], check=True,
                       capture_output=True)
    with open(jpg, "rb") as fh:
        return "data:image/jpeg;base64," + base64.b64encode(fh.read()).decode()


def geometry() -> dict:
    with open(os.path.join(HERE, "out", "geometry.json")) as fh:
        return json.load(fh)


CSS = """
*{box-sizing:border-box}
body{margin:0;width:1600px;background:#f6efe2;color:#231a12;font-family:Label,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased}
.wrap{padding:0 90px}
h1{font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500,"opsz" 120;font-weight:400;font-size:112px;
  line-height:.9;margin:0;text-transform:uppercase;letter-spacing:-.01em}
h2{font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500,"opsz" 60;font-weight:400;font-size:58px;
  line-height:1;margin:0 0 14px;text-transform:uppercase}
.kick{font-size:20px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#6e6153}
p{font-size:25px;line-height:1.5;margin:0;color:#3b2e22;max-width:1300px}
.sec{padding-top:80px;padding-bottom:80px;border-top:2px solid rgb(35 26 18 / .12)}
.panel{display:flex;align-items:center;justify-content:center;border-radius:28px;position:relative;overflow:hidden}
.cap{font-size:19px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.row{display:flex;gap:28px}
.note{font-size:21px;line-height:1.45;color:#5e5144;margin-top:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{display:flex;flex-direction:column;gap:16px}
.card .panel{height:300px}
.verdict{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600}
.dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:22px;flex:none}
.yes{background:#3f7a56}.no{background:#a3433f}
.sw{flex:1;border-radius:24px;overflow:hidden;border:2px solid rgb(35 26 18 / .12);background:#fcf8f0}
.sw .chip{height:190px}
.sw .t{padding:20px 22px 24px;font-size:21px;line-height:1.45}
.sw b{display:block;font-size:24px;margin-bottom:4px}
.dash{position:absolute;border:2px dashed #a58039}
.x{position:absolute;background:rgb(165 128 57 / .22);border:2px solid #a58039;display:grid;place-items:center;
  font:600 20px Label;color:#7a5518}
.ln{position:absolute;left:40px;right:40px;height:0;border-top:2px solid #a3433f}
.lnl{position:absolute;right:16px;font-size:18px;font-weight:600;letter-spacing:.08em;color:#a3433f;
  text-transform:uppercase;background:#fcf8f0;padding:0 8px;transform:translateY(-50%)}
.mins{display:flex;align-items:flex-end;gap:90px;padding:50px 60px;background:#fcf8f0;border-radius:28px}
.mins .card{align-items:flex-start}
.foot{padding:50px 0 70px;border-top:2px solid rgb(35 26 18 / .12);display:grid;grid-template-columns:1fr 1fr;
  gap:40px;font-size:21px;line-height:1.6;color:#5e5144}
.foot b{color:#231a12}
"""


def header() -> str:
    return f"""
<div class="wrap" style="padding-top:90px;padding-bottom:70px">
  <div class="kick" style="display:flex;justify-content:space-between;margin-bottom:46px">
    <span>Parshwanath Infra · brand sheet</span><span>Logo 05 Sheltering Arch · final · Oct 2026</span></div>
  <h1>The Sheltering Arch</h1>
  <p style="margin-top:28px">A seven-lobed cusped arch, the torana of Gujarat's Solanki gateways, standing on an otla,
  the raised threshold of a Gujarati home. Seven equal lobes: a quiet canopy, never a figure. The name stands on the
  same ground as the arch.</p>
</div>
<div class="wrap"><div class="panel" style="height:470px;background:#fcf8f0;border:2px solid rgb(35 26 18 / .1)">
  {svg("horizontal-duo-light.svg", "width:1180px")}</div></div>
<div class="wrap row" style="margin-top:28px">
  <div class="panel" style="flex:1.25;height:520px;background:#231a12">{svg("stacked-duo-dark.svg", "width:430px")}
    <span class="cap" style="position:absolute;left:30px;top:26px;color:#bfb09a">Stacked · on espresso</span></div>
  <div class="panel" style="flex:1;height:520px;background:#120e0a">{svg("mark-warm-gold.svg", "height:330px")}
    <span class="cap" style="position:absolute;left:30px;top:26px;color:#9a8b76">Mark · on dark paper</span></div>
</div>"""


def clear_space(geo: dict) -> str:
    box = geo["horizontal"]["box"]
    width_px = 1000
    s = width_px / box[2]
    h_px = box[3] * s
    x_px = geo["mark"]["arch_width"] / 2 * s  # X = half the arch width
    spring = geo["mark"]["springline"] * s
    pad = 70
    left, top = (1420 - width_px) / 2, pad + x_px
    panel_h = h_px + 2 * x_px + 2 * pad
    return f"""
<div class="wrap sec" style="margin-top:80px">
  <h2>Clear space</h2>
  <p>Keep a margin of <b>X</b> on every side, where X is half the arch's width (it equals the cap height of
  PARSHWANATH in the horizontal lockup). In the lockup the cap top sits on the arch's springline and INFRA stands on
  the otla's ground line; keep the parts together, never re-space them.</p>
  <div class="panel" style="margin-top:40px;height:{panel_h:.0f}px;background:#fcf8f0;display:block">
    <div class="dash" style="left:{left - x_px:.1f}px;top:{top - x_px:.1f}px;width:{width_px + 2 * x_px:.1f}px;height:{h_px + 2 * x_px:.1f}px"></div>
    <div style="position:absolute;left:{left:.1f}px;top:{top:.1f}px">{svg("horizontal-espresso.svg", f"width:{width_px}px")}</div>
    <div class="x" style="left:{left - x_px:.1f}px;top:{top:.1f}px;width:{x_px:.1f}px;height:{x_px:.1f}px">X</div>
    <div class="x" style="left:{left:.1f}px;top:{top - x_px:.1f}px;width:{x_px:.1f}px;height:{x_px:.1f}px">X</div>
    <div class="ln" style="top:{top + spring:.1f}px"></div><span class="lnl" style="top:{top + spring:.1f}px">springline</span>
    <div class="ln" style="top:{top + h_px:.1f}px"></div><span class="lnl" style="top:{top + h_px:.1f}px">ground</span>
  </div>
</div>"""


def minimum_sizes() -> str:
    return f"""
<div class="wrap sec">
  <h2>Minimum size</h2>
  <p>Shown at true pixel size. Below these, INFRA and the lobes stop reading: use the mark alone, then the favicon.</p>
  <div class="mins" style="margin-top:40px">
    <div class="card">{svg("horizontal-espresso.svg", "width:180px")}<span class="note"><b>Horizontal</b><br>180 px wide
      · print 35 mm</span></div>
    <div class="card">{svg("stacked-espresso.svg", "width:110px")}<span class="note"><b>Stacked</b><br>110 px wide
      · print 22 mm</span></div>
    <div class="card">{svg("mark-espresso.svg", "height:28px")}<span class="note"><b>Mark</b><br>28 px tall · print 6 mm
      </span></div>
    <div class="card"><img src="../png/favicon-16.png" width="16" height="16" style="display:block"><span class="note">
      <b>Favicon</b><br>16 px: the heavier small mark (svg/favicon.svg)</span></div>
  </div>
</div>"""


SWATCHES = (
    ("Espresso", "#231a12", "35 26 18", "The logo on champagne paper; all text."),
    ("Gold", "#a58039", "165 128 57", "The mark on light grounds; buttons."),
    ("Deep gold", "#7a5518", "122 85 24", "Gold for small sizes and fine print on light."),
    ("Warm gold", "#d9b263", "217 178 99", "The mark on espresso and dark paper."),
    ("Champagne", "#f6efe2", "246 239 226", "Paper; the name on dark grounds."),
    ("Dark paper", "#120e0a", "18 14 10", "Night ground for warm gold."),
)


def colours() -> str:
    cells = "".join(
        f'<div class="sw"><div class="chip" style="background:{hx}"></div><div class="t"><b>{name}</b>{hx.upper()}'
        f' · RGB {rgb}<br><span style="color:#6e6153">{use}</span></div></div>'
        for name, hx, rgb, use in SWATCHES
    )
    return f"""
<div class="wrap sec">
  <h2>Colours</h2>
  <p>One colour wherever possible: espresso on light, champagne or warm gold on dark, white on photographs. The
  two-colour lockup (gold mark, ink name) is for the site, signage and print on champagne or espresso.</p>
  <div class="row" style="margin-top:40px;gap:20px">{cells}</div>
  <p class="note">Print: match the hex values on a printed proof; no Pantone references are set yet.</p>
</div>"""


def card(ok: bool, text: str, inner: str, bg: str) -> str:
    mark_ = '<span class="dot yes">&#10003;</span>' if ok else '<span class="dot no">&#10005;</span>'
    return (f'<div class="card"><div class="panel" style="background:{bg}">{inner}</div>'
            f'<div class="verdict">{mark_}{text}</div></div>')


def do_dont() -> str:
    photo = photo_uri()
    photo_bg = f"url({photo}) center/cover"
    scrim = "<div style='position:absolute;inset:0;background:rgb(18 14 10 / .58)'></div>"
    impression = ("<span style='position:absolute;right:14px;bottom:12px;font-size:14px;color:#f6efe2cc;"
                  "letter-spacing:.06em'>Artist's impression</span>")
    retyped = ("<div style='display:flex;align-items:center;gap:16px'>" + svg("mark-espresso.svg", "height:96px") +
               "<span style='font:700 34px Label;letter-spacing:.02em'>Parshwanath Infra</span></div>")
    cards = [
        card(True, "Espresso on champagne paper", svg("horizontal-espresso.svg", "width:400px"), "#f6efe2"),
        card(True, "Two colours on espresso", svg("horizontal-duo-dark.svg", "width:400px"), "#231a12"),
        card(True, "White on a photo, over a dark scrim",
             scrim + "<div style='position:relative'>" + svg("horizontal-white.svg", "width:400px") + "</div>" +
             impression, photo_bg),
        card(False, "Do not stretch or squash",
             svg("horizontal-espresso.svg", "width:400px;transform:scaleX(1.18) scaleY(.82)"), "#f6efe2"),
        card(False, "Do not recolour outside the palette",
             svg("horizontal-espresso.svg", "width:400px").replace('fill="#231a12"', 'fill="#2f6db5"'), "#f6efe2"),
        card(False, "No shadows, glows, outlines or effects",
             svg("horizontal-gold.svg", "width:400px;filter:drop-shadow(5px 7px 4px rgb(0 0 0 / .45))"), "#f6efe2"),
        card(False, "Do not re-set the name in another typeface", retyped, "#f6efe2"),
        card(False, "Do not rotate or rearrange the parts",
             svg("stacked-espresso.svg", "height:230px;transform:rotate(-9deg)"), "#f6efe2"),
        card(False, "Not on busy or low-contrast grounds",
             "<div style='position:relative'>" + svg("horizontal-gold.svg", "width:400px") + "</div>" + impression,
             photo_bg),
    ]
    return f"""
<div class="wrap sec">
  <h2>Do and don't</h2>
  <p>Use the supplied files only (svg/ for screens and print, png/ for apps that need pixels).</p>
  <div class="grid3" style="margin-top:40px">{''.join(cards)}</div>
</div>"""


def footer() -> str:
    return """
<div class="wrap"><div class="foot">
  <div><b>Type</b> · the name is Cormorant Garamond 600 (SIL Open Font License), letter-spaced and converted to
  outlines: no font is needed to open or print the files. Site text stays in the site's own faces.</div>
  <div><b>Files</b> · brand/logo/svg (outlined, five colours, two-colour lockups, favicon), brand/logo/png
  (exports, app icons, avatars), brand/logo/mockups. Source and rebuild: brand/logo/_build.</div>
</div></div>"""


def main() -> None:
    geo = geometry()
    fonts = board.font_face("Display", "playfair") + board.font_face("Label", "zalando")
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{fonts}{CSS}</style></head><body>"
            f"{header()}{clear_space(geo)}{minimum_sizes()}{colours()}{do_dont()}{footer()}</body></html>")
    # The page sits in brand/logo/_build/out so the relative ../png/ image paths resolve.
    page = os.path.join(HERE, "out", "brand-sheet.html")
    with open(page, "w") as fh:
        fh.write(html.replace("../png/", os.path.join(LOGO, "png") + "/"))
    jobs = os.path.join(SCRATCH, "jobs-brand-sheet.json")
    os.makedirs(SCRATCH, exist_ok=True)
    with open(jobs, "w") as fh:
        json.dump([{"html": page, "png": os.path.join(LOGO, "brand-sheet.png"), "width": 1600}], fh)
    subprocess.run(["node", RENDER, jobs], check=True)


if __name__ == "__main__":
    main()
