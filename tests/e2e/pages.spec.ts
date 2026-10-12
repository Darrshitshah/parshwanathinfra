/**
 * Every page: loads, no console errors, no horizontal scroll, exactly one h1, no RERA text, no em or en dash in
 * the rendered text, no serious or critical axe violations. Owner: qa-lead.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectConsole, gotoReady, PAGES, scrollThrough } from "./helpers";

for (const { path, name } of PAGES) {
  test.describe(`page ${name}`, () => {
    test("loads without console errors and without horizontal scroll", async ({ page }) => {
      const log = collectConsole(page);
      const response = await page.goto(path, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await scrollThrough(page);
      expect(log.errors, `console errors on ${path}`).toEqual([]);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth, `horizontal scroll on ${path}`).toBeLessThanOrEqual(overflow.clientWidth);
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test("has no RERA text and no em or en dash in rendered HTML", async ({ page }) => {
      await gotoReady(page, path);
      await scrollThrough(page);
      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText);
      expect(/rera/i.test(text), "RERA in visible text").toBe(false);
      expect(/rera/i.test(html.replace(/[a-z]+rera[a-z]*/gi, (m) => (/^rera$/i.test(m) ? m : ""))), "RERA token in HTML").toBe(false);
      const dashes = html.match(/[\u2013\u2014]/g) ?? [];
      expect(dashes.length, "em or en dash in rendered HTML").toBe(0);
    });

    test("axe finds no serious or critical violations", async ({ page }) => {
      await gotoReady(page, path);
      await scrollThrough(page);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
      const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = bad.map((v) => `${v.impact} ${v.id}: ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
      expect(summary, `axe on ${path}`).toEqual([]);
    });
  });
}

test("404 page renders with a way home", async ({ page }) => {
  const log = collectConsole(page, true);
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /home|back|plan/i }).first()).toBeVisible();
  expect(log.errors).toEqual([]);
});

test("the dev-only motion lab answers 404 in production", async ({ page }) => {
  const response = await page.goto("/motion-lab");
  expect(response?.status()).toBe(404);
});

test("WhatsApp button links wa.me/917874305000 and opens in a new tab safely", async ({ page }) => {
  await gotoReady(page, "/");
  const link = page.locator("a[data-whatsapp]");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/917874305000(\?|$)/);
  expect(await link.getAttribute("target")).toBe("_blank");
  expect(await link.getAttribute("rel")).toContain("noopener");
});

test("the WhatsApp button is present on every page", async ({ page }) => {
  for (const { path } of PAGES) {
    await gotoReady(page, path);
    await expect(page.locator("a[data-whatsapp]"), path).toHaveCount(1);
  }
});
