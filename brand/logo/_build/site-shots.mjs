// Screenshots of the logo on the built site: header (top and scrolled, plus a close up of the logo), footer, the open
// mobile menu, at 390 and 1440 px in light and dark; the icons and the OG image. Serve a production build first:
//   NEXT_DIST_DIR=.next-brand npm run build && NEXT_DIST_DIR=.next-brand npx next start -p 3121 -H 127.0.0.1
// Usage: node brand/logo/_build/site-shots.mjs <outDir> [tag]   (review.py reads <outDir> through LOGO_SHOTS)
import { createRequire } from "node:module";
const require = createRequire("/Users/darshit/CLAUDE the GOD/Parshwanath portfolio /package.json");
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:3121";
const out = process.argv[2];
const tag = process.argv[3] ?? "";
const browser = await chromium.launch({ channel: "chrome" });

async function page(width, theme, dsf = 2) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: dsf, colorScheme: theme, reducedMotion: "reduce" });
  await ctx.addInitScript((t) => {
    try { localStorage.setItem("pi-theme", t); sessionStorage.setItem("pi-loader-seen", "1"); } catch {}
  }, theme);
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  return { ctx, p };
}

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark"]) {
    const { ctx, p } = await page(width, theme);
    const name = `${width}-${theme}${tag}`;
    await p.screenshot({ path: `${out}/header-top-${name}.png`, clip: { x: 0, y: 0, width, height: 110 } });
    const hb = await p.locator("header a[href='/']").first().boundingBox();
    if (hb) await p.screenshot({ path: `${out}/header-logo-${name}.png`, clip: { x: hb.x - 16, y: hb.y - 12, width: hb.width + 32, height: hb.height + 24 } });
    await p.mouse.wheel(0, 1400);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${out}/header-scrolled-${name}.png`, clip: { x: 0, y: 0, width, height: 110 } });
    const flogo = p.locator("footer .logo").first();
    await flogo.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 260));
    await p.waitForTimeout(1200);
    const box = await flogo.boundingBox();
    if (box) await p.screenshot({ path: `${out}/footer-${name}.png`, clip: { x: 0, y: Math.max(0, box.y - 140), width, height: 420 } });
    if (width === 390) {
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(500);
      await p.getByRole("button", { name: /menu/i }).first().click();
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `${out}/menu-${name}.png` });
    }
    await ctx.close();
  }
}

// Icons
const ctx = await browser.newContext({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
for (const scheme of ["light", "dark"]) {
  await p.emulateMedia({ colorScheme: scheme });
  const bg = scheme === "light" ? "#f1efea" : "#202124";
  await p.setContent(`<body style="margin:0;background:${bg};display:flex;gap:28px;align-items:center;padding:24px;font:12px sans-serif;color:#888">
    <img src="${BASE}/icon.svg" width="16" height="16"><img src="${BASE}/icon.svg" width="32" height="32">
    <img src="${BASE}/favicon.ico" width="16" height="16"><img src="${BASE}/favicon.ico" width="32" height="32">
    <img src="${BASE}/apple-icon" width="180" height="180"></body>`);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/icons-${scheme}${tag}.png`, clip: { x: 0, y: 0, width: 420, height: 230 } });
}
await p.goto(`${BASE}/opengraph-image`);
await p.setViewportSize({ width: 1200, height: 630 });
await p.screenshot({ path: `${out}/og${tag}.png` });
await browser.close();
console.log("done");
