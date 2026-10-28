"""Review sheet for Darshit (read on a phone): one portrait page, 1600 px wide, showing the logo where it lives: the
site header in light and dark (desktop and phone), the mobile menu and footer, the favicon in a browser tab, the
home-screen icon, the link preview (OG card) and the two mockups.

Usage (from the project folder): python3 brand/logo/_build/review.py
Needs the screenshots of the built site, made by site-shots.mjs and site-phones.mjs into one folder (default: the
session scratch folder, override with LOGO_SHOTS), and the mockups (run mockups.py first).
Writes brand/logo/review-sheet.png.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import mockups  # noqa: E402  (fonts, paths, palette)

PROJECT = mockups.PROJECT
LOGO = mockups.LOGO
OUT = mockups.OUT
SHOTS = os.environ.get(
    "LOGO_SHOTS",
    "/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/brand/v2",
)
ICON_SVG = os.path.join(PROJECT, "src", "app", "icon.svg")
TAB_TITLE = "Parshwanath Infra · Shiv Shiva Township"

CSS = """
.wrap{padding:0 80px}
.hero{padding:64px 80px 40px}
.hero h1{margin:26px 0 0;font-size:104px}
.hero p{font-size:25px;line-height:1.5;color:#3b2e22;margin:20px 0 0;max-width:1300px}
section.wrap{border-top:1.5px solid rgb(35 26 18 / .14);padding:60px 80px 72px}
h2{font-family:Display;font-weight:400;font-size:58px;line-height:1;margin:0 0 10px;text-transform:uppercase}
.sub{font-size:22px;line-height:1.5;color:#5e5144;margin:0 0 30px;max-width:1300px}
.lab{font-size:17px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#6e6153;margin:0 0 12px}
img{display:block}
.shot{width:100%;border-radius:18px;box-shadow:0 0 0 1.5px rgb(35 26 18 / .12)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:32px}
.phones{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
.phone{border-radius:34px;overflow:hidden;box-shadow:0 0 0 6px #231a12,0 18px 40px -16px rgb(35 26 18 / .45);
  margin:6px}
.phone img{width:100%}
.cap{font-size:18px;line-height:1.4;color:#5e5144;margin-top:18px;text-align:center}
.tabs{border-radius:16px;overflow:hidden;box-shadow:0 0 0 1.5px rgb(35 26 18 / .12)}
.strip{display:flex;align-items:flex-end;gap:2px;height:84px;padding:0 20px;font-family:system-ui,sans-serif}
.tab{display:flex;align-items:center;gap:16px;height:68px;padding:0 24px;border-radius:18px 18px 0 0;font-size:24px;
  width:520px;white-space:nowrap;overflow:hidden}
.tab span{overflow:hidden;text-overflow:ellipsis;flex:1}
.tab.other{background:transparent;width:360px}
.bar2{height:64px;display:flex;align-items:center;padding:0 24px;gap:18px}
.url{flex:1;height:44px;border-radius:22px;display:flex;align-items:center;padding:0 22px;font-size:22px;
  font-family:system-ui,sans-serif}
.light .strip{background:#dee1e6;color:#3c4043}.light .tab.active,.light .bar2{background:#fff}
.light .url{background:#f1f3f4;color:#5f6368}
.dark .strip{background:#202124;color:#e8eaed}.dark .tab.active,.dark .bar2{background:#35363a}
.dark .url{background:#202124;color:#bdc1c6}
.true{display:flex;gap:40px;align-items:center;margin-top:28px}
.true div{display:flex;gap:18px;align-items:center;padding:18px 24px;border-radius:14px}
.home{display:flex;gap:56px;align-items:center;margin-top:36px}
.wall{width:420px;height:300px;border-radius:28px;background:linear-gradient(160deg,#5b6b78,#2e3a44);display:grid;
  place-items:center}
.app{display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font:500 20px system-ui,sans-serif}
.app img{width:150px;height:150px;border-radius:34px}
.og{width:100%;border-radius:18px;box-shadow:0 0 0 1.5px rgb(35 26 18 / .12),0 18px 40px -20px rgb(35 26 18 / .35)}
.mock{width:100%;border-radius:18px;box-shadow:0 0 0 1.5px rgb(35 26 18 / .12)}
.foot{padding:40px 80px 72px;font-size:19px;line-height:1.6;color:#5e5144;border-top:1.5px solid rgb(35 26 18 / .14)}
"""


def shot(name: str) -> str:
    path = os.path.join(SHOTS, name)
    if not os.path.exists(path):
        raise SystemExit(f"missing screenshot {path}: run the screenshot scripts against the built site first")
    return "file://" + path


def favicon(fill: str, size: int) -> str:
    with open(ICON_SVG) as fh:
        d = re.search(r' d="([^"]+)"', fh.read()).group(1)
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 16 16" style="display:block;flex:none">'
            f'<path d="{d}" fill="{fill}"/></svg>')


def tab_strip(theme: str) -> str:
    fill = mockups.ESPRESSO if theme == "light" else mockups.WARM_GOLD
    return (
        f'<div class="tabs {theme}"><div class="strip">'
        f'<div class="tab active">{favicon(fill, 32)}<span>{TAB_TITLE}</span><span style="flex:none">×</span></div>'
        '<div class="tab other"><span>New tab</span></div></div>'
        '<div class="bar2"><div class="url">Website address TBD</div></div></div>'
    )


def body() -> str:
    hero = (
        '<div class="hero"><div class="top" style="padding:0"><span class="kick">Parshwanath Infra · logo review</span>'
        '<span class="tag">05 Sheltering Arch · Oct 2026</span></div>'
        "<h1>The logo, in place</h1>"
        "<p>Every place the new logo now appears: the website header, menu and footer in light and dark, the browser "
        "tab, the phone home screen and the link preview, plus two mockups for the gate and the letterhead.</p></div>"
    )
    desktop = (
        '<section class="wrap"><h2>Website · desktop</h2>'
        '<p class="sub">The header pill at 1440 px: gold arch, espresso name, the same two-colour lockup as the '
        "footer and the menu. In dark mode the name turns champagne and the arch warm gold.</p>"
        '<p class="lab">Light</p>'
        f'<img class="shot" src="{shot("header-top-1440-light.png")}">'
        '<p class="lab" style="margin-top:28px">Dark</p>'
        f'<img class="shot" src="{shot("header-top-1440-dark.png")}">'
        '<div class="pair">'
        f'<div><p class="lab">Close up · light</p><img class="shot" src="{shot("header-logo-1440-light.png")}"></div>'
        f'<div><p class="lab">Close up · dark</p><img class="shot" src="{shot("header-logo-1440-dark.png")}"></div>'
        "</div></section>"
    )
    phones = [
        ("phone-top-light.png", "Header · light"),
        ("phone-top-dark.png", "Header · dark"),
        ("menu-390-light.png", "Menu open"),
        ("phone-footer-dark.png", "Footer"),
    ]
    phone = (
        '<section class="wrap"><h2>Website · phone</h2>'
        '<p class="sub">At 390 px the header shows the arch alone (the name does not fit beside Enquire and the menu '
        "button); the open menu and the footer carry the full lockup.</p>"
        '<div class="phones">'
        + "".join(f'<div><div class="phone"><img src="{shot(f)}"></div><div class="cap">{c}</div></div>' for f, c in phones)
        + "</div></section>"
    )
    icons = (
        '<section class="wrap"><h2>Browser tab and home screen</h2>'
        '<p class="sub">The favicon is a heavier small arch drawn for 16 and 32 px. It turns warm gold when the browser '
        "is dark. Tabs below are drawn at 2× so they read on a phone.</p>"
        f'{tab_strip("light")}<div style="height:24px"></div>{tab_strip("dark")}'
        '<div class="true"><span class="lab" style="margin:0">Actual size</span>'
        f'<div style="background:#dee1e6">{favicon(mockups.ESPRESSO, 16)}{favicon(mockups.ESPRESSO, 32)}</div>'
        f'<div style="background:#202124">{favicon(mockups.WARM_GOLD, 16)}{favicon(mockups.WARM_GOLD, 32)}</div></div>'
        '<div class="home"><div class="wall"><div class="app">'
        f'<img src="{shot("apple-icon.png")}"><span>Parshwanath Infra</span></div></div>'
        '<p class="sub" style="margin:0;max-width:640px">Saved to an iPhone home screen: the warm gold arch on espresso. '
        "iOS rounds the corners itself.</p></div></section>"
    )
    og = (
        '<section class="wrap"><h2>Link preview</h2>'
        '<p class="sub">What WhatsApp, LinkedIn and others show when the site link is shared: the lockup above the '
        "township's name, beside the artist's impression.</p>"
        f'<img class="og" src="{shot("og.png")}"></section>'
    )
    mock_dir = os.path.join(LOGO, "mockups")
    mocks = (
        '<section class="wrap"><h2>Mockups</h2>'
        '<p class="sub">Flat drawings to judge size and colour, not final artwork or site drawings.</p>'
        f'<img class="mock" src="file://{os.path.join(mock_dir, "gate-signboard.png")}">'
        '<div style="height:40px"></div>'
        f'<img class="mock" src="file://{os.path.join(mock_dir, "letterhead.png")}"></section>'
    )
    foot = ('<div class="foot">Files: brand/logo (svg, png, brand-sheet.png, mockups). The site uses '
            "src/components/ui/Logo.tsx, src/app/icon.svg, favicon.ico, apple-icon.tsx and the OG card.</div>")
    return hero + desktop + phone + icons + og + mocks + foot


def main() -> None:
    html = mockups.page(body(), CSS)
    src = os.path.join(OUT, "review-sheet.html")
    with open(src, "w") as fh:
        fh.write(html)
    jobs = [{"html": src, "png": os.path.join(LOGO, "review-sheet.png"), "width": 1600, "height": 1000}]
    jobs_path = os.path.join(OUT, "review-jobs.json")
    with open(jobs_path, "w") as fh:
        json.dump(jobs, fh)
    subprocess.run(["node", mockups.RENDER, jobs_path], check=True)


if __name__ == "__main__":
    main()
