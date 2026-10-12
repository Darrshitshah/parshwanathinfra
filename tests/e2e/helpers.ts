/** Shared helpers for the e2e suites (owner: qa-lead). */
import type { ConsoleMessage, Page, Route } from "@playwright/test";

export const PAGES = [
  { path: "/", name: "home" },
  { path: "/projects", name: "projects" },
  { path: "/projects/shiv-shiva", name: "project" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
  { path: "/disclaimer", name: "disclaimer" },
] as const;

/** Console messages that are expected noise: the browser logs a failed navigation to a 404 page. */
const IGNORED = [/status of 404/i];

export interface ConsoleLog {
  errors: string[];
  warnings: string[];
}

export function collectConsole(page: Page, allow404 = false): ConsoleLog {
  const log: ConsoleLog = { errors: [], warnings: [] };
  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    if (msg.type() === "error") {
      if (allow404 && IGNORED.some((re) => re.test(text))) return;
      log.errors.push(text.slice(0, 300));
    } else if (msg.type() === "warning") log.warnings.push(text.slice(0, 200));
  });
  page.on("pageerror", (err) => log.errors.push(`pageerror: ${err.message.slice(0, 300)}`));
  return log;
}

/** Scroll the whole page in steps so lazy sections mount and pinned stages play. */
export async function scrollThrough(page: Page, step = 700, pause = 120): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(pause);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForTimeout(1200);
}

export type EnquiryMock = { calls: unknown[]; mode: "ok" | "not-configured" | "invalid" | "rate" | "error" };

/** Intercept POST /api/enquiry; returns the recorded calls and a mutable mode. */
export async function mockEnquiry(page: Page, mode: EnquiryMock["mode"] = "ok"): Promise<EnquiryMock> {
  const state: EnquiryMock = { calls: [], mode };
  await page.route("**/api/enquiry", async (route: Route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    state.calls.push(request.postDataJSON());
    switch (state.mode) {
      case "ok":
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      case "not-configured":
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "not-configured" }) });
      case "invalid":
        return route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "invalid", errors: { phone: "phoneInvalid" } }) });
      case "rate":
        return route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "rate-limited" }) });
      default:
        return route.fulfill({ status: 500, contentType: "text/plain", body: "boom" });
    }
  });
  return state;
}

export function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 768;
}
