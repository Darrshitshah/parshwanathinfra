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
- [~] step 4 screenshots done in scratchpad hero-wire (390/1440, light/dark, t1/t7, reduced); fixed: label moved top left under header (bottom edge is under the next section sheet), dark-glass pills, scrim mid stops raised, wordmark halo. Lighthouse pending.
