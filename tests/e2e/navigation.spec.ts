/** Navigation, page transitions, back and forward, mobile menu, skip link. Owner: qa-lead. */
import { expect, test } from "@playwright/test";
import { collectConsole, gotoReady, isPhone } from "./helpers";

async function clickNav(page: import("@playwright/test").Page, name: RegExp) {
  if (isPhone(page)) {
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name }).first().click();
  } else {
    await page.getByRole("navigation", { name: /primary/i }).getByRole("link", { name }).click();
  }
}

test("header links move between pages, with a working back and forward", async ({ page }) => {
  const log = collectConsole(page);
  await gotoReady(page, "/");
  await clickNav(page, /^about$/i);
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("h1")).toBeVisible();
  await clickNav(page, /^contact$/i);
  await expect(page).toHaveURL(/\/contact$/);
  await clickNav(page, /^projects$/i);
  await expect(page).toHaveURL(/\/projects$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("h1")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("h1")).toBeVisible();
  expect(log.errors).toEqual([]);
});

test("after a transition the new page is visible, scrolled to the top and not covered by the curtain", async ({ page }) => {
  await gotoReady(page, "/");
  await page.evaluate(() => window.scrollTo(0, 1500));
  await clickNav(page, /^about$/i);
  await expect(page).toHaveURL(/\/about$/);
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(40);
  // The h1 must be hit-testable at its centre: nothing (a curtain) on top of it.
  const covered = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return "no h1";
    const r = h1.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 100), Math.min(r.top + r.height / 2, innerHeight - 2));
    return hit && (h1 === hit || h1.contains(hit)) ? "ok" : `covered by ${hit?.tagName}.${(hit as HTMLElement | null)?.className?.toString().slice(0, 60)}`;
  });
  expect(covered).toBe("ok");
});

test("the logo returns home and the skip link targets main", async ({ page }) => {
  await gotoReady(page, "/about");
  await page.getByRole("link", { name: /home/i }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await gotoReady(page, "/about");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip to content/i });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  expect(await skip.getAttribute("href")).toBe("#main");
  await expect(page.locator("#main")).toHaveCount(1);
});

test("the mobile menu opens, traps focus, closes with Escape and restores focus", async ({ page }) => {
  test.skip(!isPhone(page), "phone only");
  await gotoReady(page, "/");
  const opener = page.getByRole("button", { name: /open menu/i });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
    expect(inside, `focus escaped the menu on Tab ${i + 1}`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the projects index leads to Shiv Shiva and the project page sub-nav jumps to sections", async ({ page }) => {
  await gotoReady(page, "/projects");
  await page.getByRole("link", { name: /shiv shiva/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/shiv-shiva/);
  await expect(page.locator("h1")).toBeVisible();
  const subnav = page.getByRole("navigation", { name: /project|section|on this page/i }).first();
  await expect(subnav).toBeVisible();
  const links = subnav.getByRole("link");
  expect(await links.count()).toBeGreaterThanOrEqual(5);
  await links.nth(2).click();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
});
