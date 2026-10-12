# QA report: Phase 3 pre-launch audit

Run 2026-10-12 by qa-lead against a production build (`NEXT_DIST_DIR=.next-qa npm run build`, `next start -p 3106`).
Suites: `tests/e2e/*.spec.ts`, `playwright.config.ts`, `lighthouserc.json`. No source file outside qa-lead paths was changed.

## Launch verdict: SHIP AFTER FIXES

The site is functionally solid: every page loads with zero console errors, enquiry flow works end to end against a mock, keyboard
and focus handling hold up, no RERA text and no em or en dashes anywhere in the rendered HTML, every image has alt text and every
render carries "Artist's impression", the WhatsApp number is correct, facts trace to SOURCE_PACK, and Three.js loads only in a
lazy chunk. It misses two hard budgets from BUILD_SPEC section 11 (LCP and initial JS) and has one accessibility failure, one
layout overflow at 360 px and one SEO misconfiguration that would go live on the Vercel preview.

### Must fix before public launch
1. **LCP over budget** (3.0 to 5.1 s measured, budget 2.5 s) on `/` and `/projects/shiv-shiva` (F1).
2. **Initial JS over budget** on the home route: 235 KB (phone) to 296 KB (desktop) transferred vs 200 KB (F2).
3. **axe serious violation** `scrollable-region-focusable` on the Living Plan list view, home and project page (F3).
4. **`/disclaimer` scrolls sideways at 360 px** (383 px wide): "Disclaimer" is too wide for the h1 at its minimum size (F4).
5. **`NEXT_PUBLIC_SITE_URL` is unset**: canonical, `og:url`, `og:image`, sitemap and JSON-LD all point at `http://localhost:3000` (F5).
6. **Home OG image is 639 KB**, over the roughly 300 KB WhatsApp limit (F6).

Everything else is MEDIUM or LOW and can follow the first preview.

## Results at a glance

### Playwright (Chromium, production server)
Projects: `mobile-360` (360x800, touch), `desktop-1440` (1440x900), `desktop-reduced` and `mobile-reduced` (`reducedMotion: "reduce"`).
Final full run: 204 tests, 4 skipped (phone-only tests on desktop projects), **10 failed, 190 passed** after a test-side fix to the
enquiry helper (the enquiry specs were re-run after that fix: 17 passed, 1 skipped on mobile-360 and desktop-1440).
The 10 failures are all real product findings, each repeating across projects:

| Failing check | Projects | Finding |
|---|---|---|
| axe: `/` serious `scrollable-region-focusable` | mobile-360, desktop-1440, desktop-reduced, mobile-reduced | F3 |
| axe: `/projects/shiv-shiva` same rule | same four | F3 |
| `/disclaimer` horizontal scroll 383 > 360 | mobile-360, mobile-reduced | F4 |

Passing, on all four projects unless noted:
- 8 pages (home, projects, project, about, contact, privacy, terms, disclaimer): HTTP 200, zero console errors after a full scroll, exactly one h1, no RERA text, no U+2013 or U+2014 in the rendered HTML, no horizontal scroll (except F4).
- 404 page renders with a way home; `/motion-lab` answers 404 in production.
- WhatsApp button on every page, `https://wa.me/917874305000?text=...`, `target=_blank`, `rel` contains `noopener`.
- Header navigation, back and forward (about, contact, projects, then back, back, forward), scroll reset and no stuck curtain after a transition, logo, skip link (`#main`), mobile menu focus trap, Escape and focus return, project sub-nav jump.
- Living Plan: keys 1 to 4 pin the four typologies (aria-pressed follows), Escape clears, Enter and Space work on the key buttons, `aria-keyshortcuts` present, Tab walks 40 stops with a visible focus indicator on each, live region and text twin present.
- Enquiry drawer: opens from CTA, `aria-modal`, focus trap forward and backward, Escape closes and restores focus; empty submit shows linked errors (`aria-invalid`, `aria-describedby`) and sends nothing; bad phones rejected, `+91` and `0` prefixes accepted; valid submit posts once to `/api/enquiry` (mocked), honeypot empty, success panel shows with a WhatsApp link; 503 not-configured shown honestly, never as success; 500 and 429 show a problem message and keep typed values; 360 px drawer fits, inputs are 16 px or larger; a 132-character name and 3000-character message do not break the layout.
- Tier B and Tier C (`?tier=B|C`) on `/` and the project page: no console errors, no horizontal scroll, no WebGL canvas on Tier C, no invisible content on Tier C.
- Flake note: `submits a valid enquiry` timed out once in 16 desktop runs (passed 8 of 8 on repeat). Probably load related; the consent checkbox was unchecked in the failure screenshot, so a slow first hydration of the lazy drawer is the suspect. Watch it.

### Lighthouse mobile (lhci, simulated 4G, 3 runs per URL, `lighthouserc.json`)

| URL | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| `/` run 1 | 67 | 100 | 100 | 100 | 5072 ms | 0 | 427 ms | 1511 ms |
| `/` run 2 | 88 | 100 | 100 | 100 | 3694 ms | 0.042 | 22 ms | 1505 ms |
| `/` run 3 | 88 | 100 | 100 | 100 | 3698 ms | 0.042 | 24 ms | 1504 ms |
| `/projects/shiv-shiva` run 1 | 94 | 100 | 100 | 100 | 3004 ms | 0.003 | 32 ms | 1204 ms |
| `/projects/shiv-shiva` run 2 | 94 | 100 | 100 | 100 | 3004 ms | 0.003 | 25 ms | 1204 ms |
| `/projects/shiv-shiva` run 3 | 90 | 100 | 100 | 100 | 3621 ms | 0 | 27 ms | 1204 ms |

Against the budget (Perf 85, others 95, LCP under 2.5 s, CLS under 0.1): categories pass (one cold home run scored perf 67, a
variance warning), CLS passes, **LCP fails every run** (F1). Transfer weight 544 to 560 KB. Lighthouse accessibility reads 100
while axe still finds F3, so do not treat the 100 as proof.

### Bundle per route (gzip, from the HTML script tags, and transferred bytes measured over CDP)

| Route | JS in HTML (gz) | JS transferred at load, phone / desktop | After full scroll (phone / desktop) | CSS gz | Fonts |
|---|---|---|---|---|---|
| `/` | 197.6 KB | 235 / 296 KB | 478 / 508 KB | 14.7 KB | 115 KB |
| `/projects` | 190.2 KB | n/a | n/a | 14.2 KB | n/a |
| `/projects/shiv-shiva` | 195.7 KB | 241 / 296 KB | 334 / 349 KB | 14.2 KB | 115 KB |
| `/about` | 190.2 KB | n/a | n/a | 14.2 KB | n/a |
| `/contact` | 223.4 KB | 263 / 285 KB | 269 / 285 KB | 14.2 KB | 203 KB |
| `/privacy` | 184.7 KB | n/a | n/a | 14.2 KB | n/a |

Heavy features are lazy: the Three.js and react-three chunk (`1_zp7r5owaw3_.js`, 158 KB gz) and the `three` core chunk appear in no
route's HTML and load only after scrolling the home page on Tier A. Tier C never creates a canvas. The framework baseline
(three shared chunks of 70, 44 and 38 KB gz) already uses about 150 KB of the 200 KB budget before GSAP, Lenis and Motion.

## Findings

Owners come from `docs/OWNERSHIP.md`.

### HIGH

**F1. LCP misses the 2.5 s budget on both audited pages.**
- Check: BUILD_SPEC section 11, LCP under 2.5 s on simulated 4G. Evidence: `.lighthouseci` runs above (3.0 to 5.1 s). Phase split on the best home run: TTFB 0.45 s, load delay 0, load time 0.18 s, **render delay 3.06 s (83 percent)**; worst run render delay 4.6 s. On the project page the LCP element is the h1 span "Shiva" with render delay 2.55 s.
- The image itself is fine (49 KB WebP, `fetchpriority=high`, preloaded) and an unthrottled measure with 4x CPU slowdown gives LCP 208 ms, so the delay is what the simulated slow network and CPU add before first paint of that element: 235 to 296 KB of JS that must run first, three render-blocking CSS files, and content that appears only after JS (loader overlay `src/components/loader/loader.css:30-36`, `html[data-js=1]` gating, `src/motion/motion.css:46-52`, split-text on the h1). I did not isolate which of these dominates.
- Owners: motion-lead (loader and reveal gating), pages-lead (hero markup, JS split), Director (build config).
- Suggested fix: make the h1 and hero image paint with no JS dependency (no opacity gating or overlay before first paint; start any reveal from the visible state or use a CSS-only first frame), cut initial JS (F2), inline or preload critical CSS, then re-run `npx lhci collect` and read the "LCP breakdown" insight. Ship criterion: three consecutive runs under 2.5 s.

**F2. Initial JavaScript over the 200 KB gzipped budget.**
- Check: BUILD_SPEC section 11, initial JS for the home route under 200 KB gz including GSAP, Lenis and Motion. Evidence: 235 KB (360 px phone profile) and 296 KB (desktop, Lenis on) transferred before any scroll; `/contact` 263 to 285 KB (the form and zod are in the initial load).
- Owners: motion-lead (GSAP, ScrollTrigger and Lenis load order, `src/motion/lazy.ts`), pages-lead (what the root layout and shell pull in, `src/features/enquiry`), Director (`layout.tsx`).
- Suggested fix: load ScrollTrigger and Lenis after first paint or after the loader, keep the enquiry form and zod out of the initial chunk until the drawer opens (the drawer chunk is already split, check what the provider imports), analyze with the Next bundle analyzer and move shared code out of the root layout.

**F3. axe serious: `scrollable-region-focusable` on the Living Plan list view.**
- Check: BUILD_SPEC section 13 (axe, no serious or critical). Evidence: `/` and `/projects/shiv-shiva`, all four test projects, 2 nodes: `div[aria-label="Buildings"]` and `div[aria-label="Plots"]`. `src/features/plan/PlanTwin.tsx:25` sets `tab = shown ? 0 : -1` and applies it to the `.lp-table-wrap` regions (lines 56 and 98); when the twin is hidden (sr-only) the scrollable wrappers have tabindex -1, which axe flags.
- Owner: plan-lead.
- Suggested fix: keep `tabIndex={0}` on the scroll wrappers always, or when hidden make the wrappers non-scrollable (`overflow: visible` inside `.sr-only`), or mark the whole hidden twin `inert` if screen readers should not reach it (but it exists as the text equivalent, so prefer the first two).

**F4. `/disclaimer` has horizontal scroll at 360 px.**
- Check: no horizontal scroll at 360. Evidence: `scrollWidth` 383 vs 360 on mobile-360 and mobile-reduced; the h1 text "Disclaimer" ends at x = 383 (`H1.t-display-1`, `src/components/legal/LegalPage.tsx`). Screenshot `scratchpad/qa-lead/disclaimer-360.png`. It also shifts fixed elements (the WhatsApp button measured 7 px off the right edge in a mobile-emulated viewport).
- Owners: pages-lead (`LegalPage`), Director (`src/styles/tokens.css`, the `t-display-1` clamp minimum).
- Suggested fix: lower the clamp minimum so the longest single word fits 328 px, or add `overflow-wrap: anywhere; hyphens: auto` to the legal h1, and add `overflow-x: clip` on `body` as a safety net.

**F5. Canonical and OG URLs point at localhost.**
- Evidence: the served HTML of `/` has `<link rel="canonical" href="http://localhost:3000"/>`, `og:url` and `og:image` on `http://localhost:3000`. `src/components/seo/site-origin.ts:6` falls back to localhost when `NEXT_PUBLIC_SITE_URL` is unset; `.env.example:5` documents localhost. Sitemap, robots and JSON-LD use the same origin.
- Owner: Director (Vercel env var). Suggested fix: set `NEXT_PUBLIC_SITE_URL` in the Vercel project (the preview address now, the real domain at launch); consider falling back to `https://${VERCEL_URL}` when unset so previews are never wrong. WhatsApp and Facebook will not render the OG card from a localhost URL.

**F6. Home Open Graph image is 639 KB.**
- Evidence: `GET /opengraph-image` returns 639,129 bytes (PNG, 1200x630). `/projects/shiv-shiva/opengraph-image` is 68 KB. WhatsApp tends to drop previews over about 300 KB, and WhatsApp is the main sharing channel.
- Owner: pages-lead (`src/app/opengraph-image.tsx`, `src/components/seo/og-card.tsx`). Suggested fix: use a smaller or flatter background, or serve a pre-optimized JPEG under 250 KB (a static `opengraph-image.jpg` in `src/app/` replaces the generated one).

### MEDIUM

**F7. Hover styles are not gated, so they stick on touch screens.**
- Check: mobile-native "Never ship: ungated `:hover`". Evidence: no `@media (hover: hover) and (pointer: fine)` anywhere in `src/**/*.css`. Ungated `:hover` rules: `src/app/globals.css` lines 196, 216, 250, 261, 292, 318, 705, 742 (links, enquire button, line button, icon button, field, radio chip), `src/features/plan/plan.css:199` and `:776`, `src/features/explorer/explorer.css:88` and `:199`.
- Owners: pages-lead (globals), plan-lead (plan and explorer css). Suggested fix: wrap each `:hover` block in `@media (hover: hover) and (pointer: fine)`, keep `:focus-visible` and `:active` outside.

**F8. No `viewport-fit=cover`, so the safe-area inset is 0 on notched iPhones.**
- Evidence: `src/app/layout.tsx:49-55` exports a `viewport` without `viewportFit: "cover"`, while `src/components/shell/WhatsAppButton.tsx:22` uses `env(safe-area-inset-bottom)`. The button will sit on the home indicator. Also no `-webkit-tap-highlight-color` reset and no `touch-action: manipulation` on buttons and links (plan.css uses `touch-action` only on the plan stage).
- Owners: Director (`layout.tsx` viewport), pages-lead (globals). Suggested fix: add `viewportFit: "cover"`, `interactiveWidget: "resizes-content"`, the tap-highlight reset and `touch-action: manipulation` on `button, a, [role=button]`.

**F9. Tap targets under 44 px in the enquiry form on a phone.**
- Evidence (annotation in the 360 px enquiry test): interest chips 40 px high (1 BHK flat 84x40, 2 BHK row house 131x40, Shop 59x40 and so on); the consent checkbox is 20x20 (its label is clickable and 44 px high, so this is acceptable under WCAG 2.5.8, but the visible box is small). The "Privacy" inline link is 44x23 (inline text link, exempt).
- Owner: pages-lead (`src/features/enquiry/EnquiryFields.tsx`, `.radio-chip` in globals). Suggested fix: `min-height: 44px` on chips.

**F10. The unit and plot tables print "TBD" hundreds of times.**
- Evidence: the rendered text of `/` has 367 "TBD" tokens and the project page 378 (floor, sector, area columns per plot and building). Honest, per the rules, but heavy reading in the plan's list view and in screen readers.
- Owner: plan-lead and data-lead. Suggested fix: collapse columns that are entirely TBD into one note ("Areas: to be confirmed") and keep per-row TBD only where a value is known for some rows.

### LOW

**F11. Console warnings in WebGL.** `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.` (`src/features/diorama/scene-runtime.ts:17` and `:65`) and four `GPU stall due to ReadPixels` driver messages on the home page, Tier A. Owner: scene-lead (diorama lead). Fix: use `PCFShadowMap`; find the ReadPixels call (likely picking or a readback in the scene loop).

**F12. UI motion timings.** `.link-draw` underline transition is 520 ms (`src/app/globals.css:192`, over the 300 ms UI budget, though it is a decorative hover on an occasional link, so acceptable). No `transition: all`, no `scale(0)`, no `ease-in` found in `src`. Nothing animates layout properties in CSS. Owner: pages-lead, informational.

**F13. Focus after client navigation.** After a link click the focus stays on the clicked link instead of moving to the new page's main or h1, so the first Tab on the new page continues from the old position. Owner: motion-lead (transition provider). Suggested fix: focus `#main` (tabindex -1) after the curtain opens.

**F14. Budget list in the contact form.** The budget options (`₹20 lakh to ...`) are visitor choices, not claims, but they are not in SOURCE_PACK. They are fine as long as no copy states a price. The Starting price (₹17.05 L) is correctly not shown; "confirm with the site office" appears instead. Owner: data-lead, informational.

## Audits done

- **Facts and claims**: all numbers on the rendered pages were read: 1,250 flats, 165 row houses, 150 shops, 1,565 total, 2024 start, both phone numbers (78743 05000 and 78743 06000), road widths (40, 30, 20 ft), the 6-level floors, the 19 row-house strips and 165 plots, all traced to SOURCE_PACK sections 1, 3 and 4 or shown as TBD. No invented numbers, prices, distances or dates found. No testimonials.
- **Dashes**: zero U+2013 and U+2014 in the rendered HTML of all 8 pages on all four test projects.
- **RERA**: zero occurrences in text or HTML on all pages. DECISIONS 2026-10-12 keeps `SHOW_RERA` false; the Director owns that legal decision.
- **Images**: 31 images on home, 30 on the project page, 1 on projects (decorative, `alt=""`), 1 on about; none missing `alt`. Every image has "Artist's impression" within five ancestor levels (including the lightbox: "01 of 19, ARTIST'S IMPRESSION").
- **Break-ui worst case**: 132-character name and 3000-character message in the drawer at 360 px: no overflow, name-too-long error shown.
- **Mobile-native**: see F7, F8, F9; 16 px inputs pass; `100dvh` is used in globals; drawer fits 360 px.
- **Animation review (static read of CSS and TS)**: see F11, F12, F13. Reduced motion: all four reduced-motion runs pass, no content stuck invisible on Tier C, Tier C creates no canvas.
- **Share images**: Home OG 639 KB (F6), project OG 68 KB, apple icon 3.8 KB, icon.svg 280 bytes.
- **Unit tests**: `npm test` 60 files, 648 tests, all passed at the time of the run (the diorama captions test was already green).

## How to rerun
```
NEXT_DIST_DIR=.next-qa npm run build && NEXT_DIST_DIR=.next-qa npx next start -p 3106 &
npx playwright test                       # all four projects, base URL http://localhost:3106 (override with E2E_BASE_URL)
CHROME_PATH="<Playwright chromium>" npx lhci collect --config=lighthouserc.json
```
`package.json` already has `test:e2e` and `lhci` scripts; `lhci autorun` also needs `lhci assert` to be wired to the same config, which `lighthouserc.json` supports.

## Not covered
Real devices (iOS Safari, a mid-range Android), a Tier B run on a throttled device, Firefox and WebKit, the real Resend and rate-limit delivery path (mocked here), the Vercel preview itself, and the lightbox keyboard, drag and zoom behaviour beyond opening it.
