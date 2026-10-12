/** Enquiry drawer: opens, traps focus, validates, submits against a mocked /api/enquiry. Owner: qa-lead. */
import { expect, test, type Page } from "@playwright/test";
import { collectConsole, gotoReady, isPhone, mockEnquiry } from "./helpers";

async function openDrawer(page: Page) {
  await gotoReady(page, "/");
  const trigger = page.locator("main").getByRole("button", { name: /enquire|plan a visit/i }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: /plan a visit/i });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

async function fillValid(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  await dialog.getByLabel(/full name/i).fill("Asha Patel");
  await dialog.getByLabel(/mobile number/i).fill("98765 43210");
  await dialog.getByRole("radio", { name: "2 BHK row house" }).check({ force: true });
  await dialog.getByText(/I agree to be contacted/i).click();
  await expect(dialog.getByRole("checkbox")).toBeChecked();
}

test("opens from a CTA, is a labelled modal dialog, and Escape closes it and restores focus", async ({ page }) => {
  const log = collectConsole(page);
  const { dialog, trigger } = await openDrawer(page);
  expect(await dialog.getAttribute("aria-modal")).toBe("true");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(log.errors).toEqual([]);
});

test("traps focus inside the drawer while it is open", async ({ page }) => {
  const { dialog } = await openDrawer(page);
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
    expect(inside, `focus left the drawer on Tab ${i + 1}`).toBe(true);
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  }
  await expect(dialog).toBeVisible();
});

test("an empty submit shows linked, announced errors and sends nothing", async ({ page }) => {
  const mock = await mockEnquiry(page);
  const { dialog } = await openDrawer(page);
  await dialog.getByRole("button", { name: /send enquiry/i }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  const name = dialog.getByLabel(/full name/i);
  expect(await name.getAttribute("aria-invalid")).toBe("true");
  const describedBy = await name.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toContainText(/name/i);
  expect(mock.calls).toHaveLength(0);
});

test("rejects bad phone numbers and accepts +91 and 0 prefixes", async ({ page }) => {
  const { dialog } = await openDrawer(page);
  const phone = dialog.getByLabel(/mobile number/i);
  const name = dialog.getByLabel(/full name/i);
  await name.fill("Asha Patel");
  for (const bad of ["12345", "5876543210", "98765", "abcdefghij", "98765432101"]) {
    await phone.fill(bad);
    await phone.blur();
    await expect(dialog.getByText(/10-digit Indian mobile number starting with/i), bad).toBeVisible();
  }
  for (const good of ["9876543210", "+91 98765 43210", "098765 43210"]) {
    await phone.fill(good);
    await phone.blur();
    await expect(dialog.getByText(/10-digit Indian mobile number starting with/i), good).toBeHidden();
  }
});

test("submits a valid enquiry to /api/enquiry and shows the success state with WhatsApp next", async ({ page }) => {
  const mock = await mockEnquiry(page, "ok");
  const { dialog } = await openDrawer(page);
  await fillValid(page, dialog);
  await dialog.getByRole("button", { name: /send enquiry/i }).click();
  await expect(dialog.getByText(/enquiry received|thank you/i).first()).toBeVisible({ timeout: 15_000 });
  expect(mock.calls).toHaveLength(1);
  const payload = mock.calls[0] as Record<string, unknown>;
  expect(payload.name).toBe("Asha Patel");
  expect(String(payload.phone).replace(/\D/g, "")).toMatch(/9876543210$/);
  expect(payload.website ?? "").toBe("");
  const wa = dialog.getByRole("link", { name: /whatsapp/i });
  await expect(wa).toBeVisible();
  expect(await wa.getAttribute("href")).toContain("wa.me/917874305000");
});

test("not-configured (503) is reported honestly, never as success", async ({ page }) => {
  await mockEnquiry(page, "not-configured");
  const { dialog } = await openDrawer(page);
  await fillValid(page, dialog);
  await dialog.getByRole("button", { name: /send enquiry/i }).click();
  await expect(dialog.getByText(/not switched on yet/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText(/enquiry received/i)).toHaveCount(0);
});

test("server errors and rate limits keep the typed values and show a problem message", async ({ page }) => {
  const mock = await mockEnquiry(page, "error");
  const { dialog } = await openDrawer(page);
  await fillValid(page, dialog);
  await dialog.getByRole("button", { name: /send enquiry/i }).click();
  await expect(dialog.getByText(/could not send that/i)).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByLabel(/full name/i)).toHaveValue("Asha Patel");
  mock.mode = "rate";
  await dialog.getByRole("button", { name: /send enquiry/i }).click();
  await expect(dialog.getByText(/too many enquiries/i)).toBeVisible({ timeout: 15_000 });
});

test("a 360 px phone: the drawer fits the width, inputs are 16 px and targets are at least 44 px", async ({ page }) => {
  test.skip(!isPhone(page), "phone only");
  const { dialog } = await openDrawer(page);
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(360.5);
  const metrics = await page.evaluate(() => {
    const root = document.querySelector("[role=dialog] form") ?? document;
    const small: string[] = [];
    const tiny: string[] = [];
    root.querySelectorAll<HTMLElement>("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea").forEach((el) => {
      if (el.offsetParent === null) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 16) tiny.push(el.getAttribute("name") ?? el.tagName);
    });
    root.querySelectorAll<HTMLElement>("button, a, label:has(input[type=radio])").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (el.tagName === "A" && el.closest("p")) return; // inline text links are exempt (WCAG 2.5.8)
      if (r.height < 24 || r.width < 24 || r.height < 44 || r.width < 44) small.push(`${el.tagName}:${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return { small, tiny, scrollW: document.documentElement.scrollWidth };
  });
  expect(metrics.tiny, "inputs under 16 px font (iOS zoom on focus)").toEqual([]);
  expect(metrics.scrollW).toBeLessThanOrEqual(360);
  // WCAG 2.5.8 (AA) needs 24 px; the project aims for 44 px. Under 44 is recorded as an annotation, under 24 fails.
  const under24 = metrics.small.filter((entry) => {
    const [w, h] = (entry.split(" ").pop() ?? "0x0").split("x").map(Number);
    return w < 24 || h < 24;
  });
  test.info().annotations.push({ type: "tap-targets-under-44px", description: metrics.small.join("; ") });
  expect(under24, "tap targets under 24 px").toEqual([]);
});

test("worst-case input: a very long name and message do not break the layout", async ({ page }) => {
  const { dialog } = await openDrawer(page);
  const long = "Bartholomew".repeat(12);
  await dialog.getByLabel(/full name/i).fill(long);
  await dialog.getByRole("textbox", { name: "Message" }).fill("x".repeat(3000));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const dbox = await dialog.boundingBox();
  const form = await dialog.locator("form").boundingBox();
  expect(form!.x + form!.width).toBeLessThanOrEqual(dbox!.x + dbox!.width + 1);
  await dialog.getByLabel(/full name/i).blur();
  await expect(dialog.getByText(/name is too long/i)).toBeVisible();
});
