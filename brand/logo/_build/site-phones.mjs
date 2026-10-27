// Full phone viewports (390 x 844 at 2x) of the built site on port 3121: the top of Home and the footer, light and
// dark, plus the generated apple icon. Usage: node brand/logo/_build/site-phones.mjs <outDir>
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire("/Users/darshit/CLAUDE the GOD/Parshwanath portfolio /package.json");
const { chromium } = require("playwright");
const out = process.argv[2];
const BASE = "http://127.0.0.1:3121";
const b = await chromium.launch({ channel: "chrome" });
for (const theme of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: "reduce" });
  await ctx.addInitScript((t) => { try { localStorage.setItem("pi-theme", t); sessionStorage.setItem("pi-loader-seen", "1"); } catch {} }, theme);
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/phone-top-${theme}.png` });
  const flogo = p.locator("footer .logo").first();
  await flogo.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/phone-footer-${theme}.png` });
  await ctx.close();
}
const r = await fetch(BASE + "/apple-icon");
writeFileSync(`${out}/apple-icon.png`, Buffer.from(await r.arrayBuffer()));
await b.close();
console.log("done");
