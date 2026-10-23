// Renders HTML files to PNG with the project's Playwright and the system Chrome, at deviceScaleFactor 1
// (an honest favicon test: a 32 px mark is drawn with 32 device pixels).
// Usage: node render.mjs jobs.json   where jobs.json = [{ "html": "/abs/board.html", "png": "/abs/board.png", "width": 1600 }]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire("/Users/darshit/CLAUDE the GOD/Parshwanath portfolio /package.json");
const { chromium } = require("playwright");

const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const job of jobs) {
    const page = await browser.newPage({
      viewport: { width: job.width ?? 1600, height: job.height ?? 1000 },
      deviceScaleFactor: job.scale ?? 1,
    });
    await page.goto(pathToFileURL(job.html).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: job.png, fullPage: true });
    await page.close();
    console.log("rendered", job.png);
  }
} finally {
  await browser.close();
}
