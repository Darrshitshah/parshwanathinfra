# Hero film wiring (Sonnet, 2026-10-28)

Brief: wire public/video/hero (manifest.json) into the home hero. Short cut on phones, full cut on desktop.
No git except diff/status and the tsconfig revert. Do not touch src/components/map, Location.tsx, package.json.

## Design (decided before coding)
- Server: `src/content/hero-film.ts` imports the manifest JSON at build time and validates it with zod; `Hero.tsx` passes a small serialisable object to the client component `src/components/home/HeroFilm.tsx`. No client fetch.
- Pure selection logic in `src/lib/hero-film.ts` (tested): narrow viewport (max 767px) = short cut + mobile encodes; otherwise full cut + desktop encodes; sources webm then mp4. Reduced motion, Save-Data, Tier C or not-ready = poster only.
- Poster: `<picture>` avif then webp, plain `<img data-hero-image fetchpriority=high>` (LCP stays an image). Film plays once and holds on the last frame (the finished township), no loop: a loop would jump from the finished township back to bare land. Pre-hydration poster is the START frame (so the film fades in from an identical frame); a `prefers-reduced-motion` `<source media>` serves the FINAL poster with no flash. Static modes (reduced motion, Save-Data, Tier C, blocked autoplay, video error) show the FINAL poster.
- Video element is only mounted after window load + idle + hero visible; plays when visible, pauses when off-screen or tab hidden. aria-hidden, muted, playsInline, no controls. A small "Pause film" toggle is added for WCAG 2.2.2 (moving content over 5 s).
- Image sequence (public/sequences/hero) stays UNUSED: the manifest only lists it under "sequence" as an alternative; nothing references it.

## Progress
- [x] step 1 loader + selection logic + tests (src/content/hero-film.ts, src/lib/hero-film.ts, tests)
- [x] step 2 HeroFilm.tsx, use-hero-film-gate.ts, Hero.tsx, globals.css (.hero-film-toggle), en.common.pauseFilm/playFilm
- [x] step 3 checks: typecheck, lint, vitest (661 pass), build OK (.next-hero)
- [x] step 4 screenshots + Lighthouse done. Scratchpad: /private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/hero-wire/ (m390 and d1440, light and dark, t1 and t7, reduced motion, m390-ended).
  Fixes made after the first screenshots: label and pause control moved top left under the header (the bottom edge sits under the next section's sheet, so the old bottom-left label was hidden), dark-glass pills in both themes, scrim middle stops raised, soft halo on the wordmark.
- Lighthouse (mobile preset, simulated throttling, 2 runs, production build): CLS 0 both; LCP 4.73 s both, LCP element is the h1 script word "Township" (render delay 90%, the poster AVIF is fetched at High priority first, the video webm starts later at Low priority); perf 0.50 (cold run, TBT 3.4 s) and 0.83 (TBT 16 ms); a11y 0.96; best practices 1.0. No baseline from before the change was measured (git is off limits), so compare with the director if LCP matters.
- Final state: typecheck, lint and vitest all green for the hero files (661 tests, 11 new in hero-film tests and HeroFilm tests). A later re-run showed typecheck/test failures ONLY in the in-progress map work (Location.tsx bodyMap, LocationMap.tsx, map-style.ts, map.test.tsx), not hero files.
