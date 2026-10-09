#!/usr/bin/env node
/**
 * Screenshot helper for agents (owner: Director). Captures a page at 360 px and 1440 px, with and without
 * reduced motion, and reports console errors and horizontal overflow.
 *
 *   node tools/dev/shot.mjs --url http://localhost:3103/ --out "<dir>" [--name home] [--widths 360,1440]
 *                           [--full] [--wait 1500] [--scroll 0.5] [--tier A|B|C]
 *
 * --scroll 0.5 scrolls to half the page height before the shot. Output: <out>/<name>-<width>[-reduced].png
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

function parseArgs(argv) {
  const args = { widths: "360,1440", name: "page", wait: "1200", scroll: "0" };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[name] = true;
    } else {
      args[name] = next;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.url || !args.out) {
  console.error("Usage: node tools/dev/shot.mjs --url <url> --out <dir> [--name n] [--widths 360,1440] [--full] [--wait ms] [--scroll 0..1] [--tier A|B|C]");
  process.exit(2);
}

mkdirSync(args.out, { recursive: true });
const widths = String(args.widths).split(",").map((w) => Number.parseInt(w, 10));
const heights = { 360: 800, 390: 844, 768: 1024, 1440: 900, 1920: 1080 };
const browser = await chromium.launch();
const report = [];

try {
  for (const width of widths) {
    for (const reduced of [false, true]) {
      const context = await browser.newContext({
        viewport: { width, height: heights[width] ?? 900 },
        reducedMotion: reduced ? "reduce" : "no-preference",
        deviceScaleFactor: 1,
        hasTouch: width < 768,
        isMobile: width < 768,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(String(err)));

      const url = new URL(args.url);
      if (args.tier) url.searchParams.set("tier", String(args.tier));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.waitForTimeout(Number(args.wait));
      const fraction = Number(args.scroll);
      if (fraction > 0) {
        await page.evaluate((f) => window.scrollTo(0, document.documentElement.scrollHeight * f), fraction);
        await page.waitForTimeout(Number(args.wait));
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const file = join(args.out, `${args.name}-${width}${reduced ? "-reduced" : ""}.png`);
      await page.screenshot({ path: file, fullPage: Boolean(args.full) });
      report.push({ file, width, reduced, horizontalOverflowPx: overflow, consoleErrors: errors });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
