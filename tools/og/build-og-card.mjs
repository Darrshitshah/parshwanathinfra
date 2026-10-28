/**
 * Builds the static share-preview card: src/app/opengraph-image.jpg (+ twitter-image.jpg, the same file).
 * Run: `node tools/og/build-og-card.mjs [--out <dir>]` (needs Google Chrome; Playwright drives it, no download).
 *
 * Why a script and a committed JPEG: link crawlers (WhatsApp, iMessage, LinkedIn) fetch the image once and some time
 * out on dynamic routes or drop images near 300 KB, so the card is rendered here, tuned under 300 KB and committed.
 * Inputs: public/video/hero/hero-poster.webp (SS-01 artist's impression), the logo outlines, the two local TTFs, and
 * the strings in src/content/copy/seo.ts (og.card). Nothing is fetched from the network.
 *
 * Layout: 1200x630, everything that matters sits in the centre 630 px column so a square crop keeps it.
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { seoCopy } from "../../src/content/copy/seo.ts";
import { LOGO_GAP, LOGO_MARK, LOGO_WORD } from "../../src/components/ui/logo-data.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

// Champagne and Espresso (src/styles/tokens.css).
const ESPRESSO = "#231a12";
const CHAMPAGNE = "#f6efe2";
const GOLD = "#d9b263";
const GOLD_SOFT = "#e8cf9a";
const LOGO_HEIGHT = 64;

const outFlag = process.argv.indexOf("--out");
const outDir = outFlag > -1 ? resolve(process.argv[outFlag + 1]) : join(ROOT, "src/app");
const card = seoCopy.og.card;

function logoSvg() {
  const markW = (LOGO_MARK.width / 100) * LOGO_HEIGHT;
  const wordW = (LOGO_WORD.width / 100) * LOGO_HEIGHT;
  const gap = LOGO_GAP * LOGO_HEIGHT;
  return `<div class="logo" role="img">
    <svg width="${markW}" height="${LOGO_HEIGHT}" viewBox="0 0 ${LOGO_MARK.width} 100"><path d="${LOGO_MARK.d}" fill="${GOLD}"/></svg>
    <svg style="margin-left:${gap}px" width="${wordW}" height="${LOGO_HEIGHT}" viewBox="0 0 ${LOGO_WORD.width} 100"><path d="${LOGO_WORD.d}" fill="${CHAMPAGNE}"/></svg>
  </div>`;
}

function html(fontUrls, posterUrl) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:"PF";src:url("${fontUrls.serif}");font-weight:500}
  @font-face{font-family:"ZS";src:url("${fontUrls.sans}");font-weight:600}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${WIDTH}px;height:${HEIGHT}px;background:${ESPRESSO};overflow:hidden}
  .stage{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
  .stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;filter:saturate(1.08) brightness(1.06)}
  .veil-top{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(18,14,10,.58) 0,rgba(18,14,10,.30) 14%,rgba(18,14,10,0) 30%)}
  .veil-bottom{position:absolute;inset:0;background:linear-gradient(to top,rgba(18,14,10,.97) 0,rgba(24,18,12,.92) 24%,rgba(30,22,15,.74) 40%,rgba(35,26,18,.34) 56%,rgba(35,26,18,0) 70%)}
  .col{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:34px 0 26px}
  .logo{display:flex;align-items:flex-start;filter:drop-shadow(0 1px 10px rgba(18,14,10,.55))}
  .bottom{display:flex;flex-direction:column;align-items:center;gap:0}
  h1{font:500 106px/0.94 "PF",serif;text-transform:uppercase;letter-spacing:-.005em;color:${CHAMPAGNE};text-align:center;text-shadow:0 2px 24px rgba(18,14,10,.55)}
  .rule{width:64px;height:2px;background:${GOLD};margin:22px 0 16px}
  .line{font:600 15px/1 "ZS",sans-serif;letter-spacing:.13em;text-transform:uppercase;color:${GOLD_SOFT};white-space:nowrap}
  .label{margin-top:18px;font:600 12px/1 "ZS",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${CHAMPAGNE};opacity:.82;border:1px solid rgba(246,239,226,.45);border-radius:999px;padding:7px 14px 6px}
  </style></head><body><div class="stage">
    <img src="${posterUrl}" alt="">
    <div class="veil-top"></div><div class="veil-bottom"></div>
    <div class="col">
      ${logoSvg()}
      <div class="bottom">
        <h1><span id="t1">${card.titleLines[0]}</span><br><span id="t2">${card.titleLines[1]}</span></h1>
        <div class="rule"></div>
        <div class="line" id="line">${card.line}</div>
        <div class="label">${seoCopy.og.artistImpression}</div>
      </div>
    </div>
  </div></body></html>`;
}

async function main() {
  const fonts = join(ROOT, "src/components/seo/fonts");
  const fontUrls = {
    serif: pathToFileURL(join(fonts, "PlayfairCondensed-500.ttf")).href,
    sans: pathToFileURL(join(fonts, "ZalandoSansExpanded-600.ttf")).href,
  };
  const posterUrl = pathToFileURL(join(ROOT, "public/video/hero/hero-poster.webp")).href;
  const workDir = await mkdtemp(join(tmpdir(), "og-card-"));
  const page = join(workDir, "card.html");
  await writeFile(page, html(fontUrls, posterUrl));

  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await tab.goto(pathToFileURL(page).href);
    await tab.evaluate(() => document.fonts.ready);
    const widths = await tab.evaluate(() => Object.fromEntries(["t1", "t2", "line"].map((id) => [id, Math.round(document.getElementById(id).getBoundingClientRect().width)])));
    console.log("text widths (safe square column is 630):", widths);
    const png = await tab.screenshot({ type: "png" });
    await mkdir(outDir, { recursive: true });
    let quality = 86;
    let jpeg;
    do {
      jpeg = await sharp(png).jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
      quality -= 2;
    } while (jpeg.length > MAX_BYTES && quality > 50);
    for (const name of ["opengraph-image.jpg", "twitter-image.jpg"]) await writeFile(join(outDir, name), jpeg);
    console.log(`wrote ${outDir}: ${jpeg.length} bytes (${(jpeg.length / 1024).toFixed(1)} KB), quality ${quality + 2}`);
  } finally {
    await browser.close();
    await rm(workDir, { recursive: true, force: true });
  }
}

await main();
