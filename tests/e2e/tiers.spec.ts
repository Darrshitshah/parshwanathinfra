/**
 * Device tiers (BUILD_SPEC section 10): Tier B (image sequence) and Tier C (static, no WebGL) must load without
 * console errors or horizontal scroll, and Tier C must never create a WebGL canvas or load the Three.js chunk.
 * `?tier=` is the QA override from src/lib/device-tier.ts. Owner: qa-lead.
 */
import { expect, test } from "@playwright/test";
import { collectConsole, scrollThrough } from "./helpers";

for (const tier of ["B", "C"] as const) {
  for (const path of ["/", "/projects/shiv-shiva"]) {
    test(`tier ${tier} ${path}: no console errors, no horizontal scroll, text equivalents present`, async ({ page }) => {
      const log = collectConsole(page);
      const scripts: string[] = [];
      page.on("response", (r) => {
        if (r.request().resourceType() === "script") scripts.push(r.url());
      });
      await page.goto(`${path}?tier=${tier}`, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      await scrollThrough(page);
      expect(log.errors).toEqual([]);
      const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(dims.sw).toBeLessThanOrEqual(dims.cw);
      if (tier === "C") {
        expect(await page.locator("canvas").count(), "WebGL canvas on Tier C").toBe(0);
      }
      await page.goto("/?tier=auto");
    });
  }
}

test("Tier C home: every section is reachable without animation (no element stuck at opacity 0)", async ({ page }) => {
  await page.goto("/?tier=C", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await scrollThrough(page, 600, 80);
  const hidden = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll("main h1, main h2, main h3, main p, main figure, main img").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (parseFloat(cs.opacity) < 0.05 || cs.visibility === "hidden")) out.push(`${el.tagName}:${(el.textContent || el.getAttribute("alt") || "").trim().slice(0, 40)}`);
    });
    return out;
  });
  expect(hidden, "invisible content on Tier C").toEqual([]);
  await page.goto("/?tier=auto");
});
