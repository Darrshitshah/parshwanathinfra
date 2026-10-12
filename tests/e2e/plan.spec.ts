/** Living Plan keyboard use: digits 1 to 4 pin a typology, Escape clears, Tab reaches hotspots. Owner: qa-lead. */
import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

async function openPlan(page: import("@playwright/test").Page) {
  await gotoReady(page, "/projects/shiv-shiva");
  await page.locator("#plan").scrollIntoViewIfNeeded();
  const region = page.getByRole("region", { name: /living plan/i });
  await region.waitFor({ state: "attached", timeout: 15_000 });
  await region.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  return region;
}

test("keys 1 to 4 pin the four typologies and Escape clears", async ({ page }) => {
  const region = await openPlan(page);
  const keys = region.locator("button.lp-key");
  await expect(keys).toHaveCount(4);
  const stage = region.locator(".lp-stage").first();
  await stage.focus();
  for (let digit = 1; digit <= 4; digit++) {
    await page.keyboard.press(String(digit));
    await expect(keys.nth(digit - 1), `key ${digit} pressed`).toHaveAttribute("aria-pressed", "true");
    for (let other = 0; other < 4; other++) {
      if (other !== digit - 1) await expect(keys.nth(other)).toHaveAttribute("aria-pressed", "false");
    }
  }
  await page.keyboard.press("Escape");
  await expect(region.locator("button.lp-key[aria-pressed=true]")).toHaveCount(0);
});

test("the typology keys are real buttons that work with Enter and Space and carry keyshortcuts", async ({ page }) => {
  const region = await openPlan(page);
  const first = region.locator("button.lp-key").first();
  expect(await first.getAttribute("aria-keyshortcuts")).toBe("1");
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-pressed", "false");
});

test("Tab moves through the plan without a keyboard trap and shows a visible focus ring", async ({ page }) => {
  const region = await openPlan(page);
  await region.locator(".lp-stage").first().focus();
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const desc = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return "none";
      const cs = getComputedStyle(el);
      const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? "ring" : cs.boxShadow !== "none" ? "shadow" : "NORING";
      return `${el.tagName}.${(el.className || "").toString().split(" ")[0]}|${ring}`;
    });
    seen.add(desc);
  }
  const list = [...seen];
  expect(list.length, "focus moved across several controls").toBeGreaterThan(4);
  expect(list.filter((d) => d.endsWith("NORING")), "controls with no visible focus indicator").toEqual([]);
});

test("the plan has a text equivalent for screen readers", async ({ page }) => {
  const region = await openPlan(page);
  const live = region.locator("[aria-live]");
  expect(await live.count()).toBeGreaterThan(0);
  const twin = await page.locator("table, [data-plan-twin], .lp-twin, details").count();
  expect(twin).toBeGreaterThan(0);
});
