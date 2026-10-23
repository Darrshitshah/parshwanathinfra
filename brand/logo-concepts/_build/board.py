"""Presentation board for one concept: HTML with inline SVG, rendered to PNG at deviceScaleFactor 1."""
from __future__ import annotations

import base64
import functools
import os

import kit
import lib


@functools.lru_cache(maxsize=None)
def font_face(family: str, key: str) -> str:
    path = os.path.join(lib.FONTS_DIR, lib.FONT_FILES[key])
    with open(path, "rb") as fh:
        data = base64.b64encode(fh.read()).decode("ascii")
    return f"@font-face{{font-family:{family};src:url(data:font/ttf;base64,{data}) format('truetype');}}"


CSS = """
*{box-sizing:border-box}
body{margin:0;width:1600px;background:#f6efe2;color:#231a12;font-family:Label,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased}
.head{display:grid;grid-template-columns:auto 1fr;column-gap:44px;align-items:end;padding:72px 80px 56px}
.num{font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500,"opsz" 400;font-size:176px;line-height:.74;
  letter-spacing:-.02em}
.name{font-family:Display;font-variation-settings:"wdth" 87.5,"wght" 500,"opsz" 120;font-size:84px;line-height:.9;
  margin:0 0 14px}
.idea{font-size:23px;line-height:1.5;max-width:1060px;margin:0;color:#3b2e22}
.tag{grid-column:1/-1;font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#6e6153;
  margin-bottom:34px;display:flex;justify-content:space-between}
.row{display:flex}
.panel{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.cap{position:absolute;left:28px;top:24px;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
.paper{background:#f6efe2}.paper .cap{color:#6e6153}
.sunk{background:#ece3d2}.sunk .cap{color:#6e6153}
.esp{background:#231a12}.esp .cap{color:#bfb09a}
.night{background:#120e0a}.night .cap{color:#9a8b76}
.jewel{background:#2f2118}.jewel .cap{color:#bfb09a}
svg path{fill:currentColor}
.c-ink{color:#231a12}.c-paper{color:#f6efe2}.c-gold{color:#a58039}.c-goldn{color:#d9b263}
.duo .r-accent{color:#a58039;fill:#a58039}.duo-n .r-accent{fill:#d9b263}
.line{border-top:1px solid rgb(35 26 18 / .14)}
.sizes{display:grid;grid-template-columns:150px repeat(3,1fr);row-gap:0;width:100%;height:100%}
.sizes>div{display:flex;align-items:center;justify-content:center;position:relative}
.sizes .lab{justify-content:flex-start;padding-left:28px;font-size:12px;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:#6e6153;background:#f6efe2}
.px{position:absolute;bottom:14px;font-size:11px;letter-spacing:.14em;font-weight:600}
.tile{background:#fcf8f0;border:1px solid rgb(35 26 18 / .12)}
.av{border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center}
.chat{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:12px 18px;width:400px;
  font-family:system-ui,-apple-system,sans-serif;box-shadow:0 1px 0 rgb(0 0 0 / .06)}
.chat b{font-size:16px;color:#111;font-weight:600}.chat span{font-size:14px;color:#667781}
.foot{padding:30px 80px 40px;font-size:15px;line-height:1.7;color:#5e5144;display:grid;grid-template-columns:1fr 1fr;
  column-gap:60px}
.foot b{color:#231a12;font-weight:600}
"""


def _svg(art: lib.Art, cls: str, width: float | None = None, height: float | None = None) -> str:
    inner = kit.svg_roles(art)
    style = []
    if width is not None:
        style.append(f"width:{width}px")
    if height is not None:
        style.append(f"height:{height}px")
    sized = inner.replace("<svg ", '<svg width="100%" height="100%" ', 1)
    joined = ";".join(style)
    return f'<div class="{cls}" style="display:flex;{joined}">{sized}</div>'


def _fit(art: lib.Art, max_w: float, max_h: float) -> tuple:
    _, _, w, h = art.box
    s = min(max_w / w, max_h / h)
    return w * s, h * s


def board_html(c: dict) -> str:
    """c: concept dict with num, name, idea, type_note, mark, horizontal, stacked, icon (square Art)."""
    hw, hh = _fit(c["horizontal"], 1240, 300)
    sw, sh = _fit(c["stacked"], 600, 470)
    icon = c["icon"]
    tile = c.get("tile", icon)
    avatar = c.get("avatar", icon)
    rows = []
    rows.append(f"""
<div class="head">
  <div class="tag"><span>Parshwanath Infra · logo concept {c['num']} of 10</span><span>{c.get('family', '')}</span></div>
  <div class="num">{c['num']}</div>
  <div><h1 class="name">{c['name']}</h1><p class="idea">{c['idea']}</p></div>
</div>""")
    rows.append(f"""
<div class="row"><div class="panel paper line" style="width:1600px;height:520px">
  <span class="cap">On champagne paper · espresso, one colour</span>
  {_svg(c['horizontal'], 'c-ink', hw, hh)}
</div></div>""")
    rows.append(f"""
<div class="row">
  <div class="panel esp" style="width:800px;height:660px"><span class="cap">On espresso · reversed</span>
    {_svg(c['stacked'], 'c-paper', sw, sh)}</div>
  <div class="panel night" style="width:800px;height:660px"><span class="cap">Gold on dark</span>
    {_svg(c['stacked'], 'c-goldn', sw, sh)}</div>
</div>""")
    sizes = []
    for label, bg, col in (("Paper", "paper", "c-ink"), ("Espresso", "esp", "c-paper"), ("Gold, dark", "night", "c-goldn")):
        sizes.append(f'<div class="lab">{label}</div>')
        for px in (64, 32, 16):
            pxcol = "#9a8b76" if bg != "paper" else "#6e6153"
            sizes.append(f'<div class="{bg}">{_svg(icon, col, px, px)}<span class="px" style="color:{pxcol}">{px} px</span></div>')
    rows.append(f"""
<div class="row line">
  <div class="panel sunk" style="width:680px;height:660px"><span class="cap">Mark · 512 px</span>
    <div class="tile" style="width:514px;height:514px;display:flex">{_svg(tile, 'c-ink', 512, 512)}</div></div>
  <div class="panel paper" style="width:920px;height:660px">
    <div class="sizes" style="grid-template-rows:repeat(3,1fr)">{''.join(sizes)}</div></div>
</div>""")
    rows.append(f"""
<div class="row line">
  <div class="panel paper" style="width:1600px;height:380px;justify-content:space-around;padding:0 60px">
    <span class="cap">Round avatar · WhatsApp, Instagram</span>
    <div class="av esp" style="width:220px;height:220px">{_svg(avatar, 'c-goldn', 220, 220)}</div>
    <div class="av" style="width:220px;height:220px;background:#e7d7b6">{_svg(avatar, 'c-ink', 220, 220)}</div>
    <div style="display:flex;flex-direction:column;gap:12px;background:#ece5dd;padding:18px;border-radius:18px">
      <div class="chat"><div class="av esp" style="width:52px;height:52px">{_svg(avatar, 'c-goldn', 52, 52)}</div>
        <div><b>Parshwanath Infra</b><br><span>Site visit confirmed for Sunday</span></div></div>
      <div class="chat"><div class="av" style="width:52px;height:52px;background:#e7d7b6">{_svg(avatar, 'c-ink', 52, 52)}</div>
        <div><b>Parshwanath Infra</b><br><span>Brochure attached</span></div></div>
    </div>
  </div>
</div>""")
    rows.append(f"""
<div class="foot line"><div><b>Type</b> · {c['type_note']}</div>
<div><b>Colours</b> · espresso #231a12 · gold #a58039 · warm gold #d9b263 on #120e0a · paper #f6efe2</div></div>""")
    head = (f"<!doctype html><html><head><meta charset='utf-8'><style>{font_face('Display', 'playfair')}"
            f"{font_face('Label', 'zalando')}{CSS}</style></head><body>")
    return head + "".join(rows) + "</body></html>"
