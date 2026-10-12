/**
 * Playwright config (owner: qa-lead). Runs against a PRODUCTION server, never the dev server:
 *   NEXT_DIST_DIR=.next-qa npm run build && NEXT_DIST_DIR=.next-qa npx next start -p 3106
 *   E2E_BASE_URL=http://localhost:3106 npx playwright test
 * Three projects: phone 360x800, desktop 1440x900, desktop with reduced motion.
 */
import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3106";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: process.env.E2E_OUT ?? "./test-results",
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: process.env.E2E_JSON ?? "test-results/results.json" }]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-360",
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "desktop-reduced",
      use: { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
    },
    {
      name: "mobile-reduced",
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
    },
  ],
});
