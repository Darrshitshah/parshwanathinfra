# OG / share-preview handoff

Agent: share-preview lead. Not committed (the director commits).

## Status (updated after each step)
- [x] Step 0: read docs and code. Found: dynamic `src/app/opengraph-image.tsx` + `src/components/seo/og-card.tsx`
  (ImageResponse, split champagne layout, JPEG q82), project `src/app/projects/[slug]/opengraph-image.tsx` (plan outline),
  `src/components/seo/page-metadata.ts` (DEFAULT_IMAGE = /opengraph-image for sub-pages), copy in `src/content/copy/seo.ts`
  (not src/copy/seo.ts), origin in `src/components/seo/site-origin.ts` (NEXT_PUBLIC_SITE_URL, then Vercel host, then localhost).
- [ ] Step 1: design the premium 1200x630 card (hero image + espresso gradient, logo, serif title, one line, label)
- [ ] Step 2: static JPEG under 300 KB wired through the file convention
- [ ] Step 3: sub-page / project decision
- [ ] Step 4: verify (typecheck, lint, vitest, build, curl, mocks)
- [x] Step 1: card designed (Chrome via Playwright, `tools/og/build-og-card.mjs`, new folder, reads hero-poster.webp,
  logo-data, two local TTFs and `seoCopy.og.card`). Draft 145 KB. Title two lines so the square crop keeps it.
- [x] Step 2/3 (code): static `src/app/opengraph-image.jpg` + `twitter-image.jpg` (144.8 KB each, 1200x630) + `.alt.txt`;
  deleted `src/app/opengraph-image.tsx`, `src/app/projects/[slug]/opengraph-image.tsx`, `src/components/seo/og-card.tsx`
  (dynamic ImageResponse cards; one card everywhere is more consistent, and the plan-outline card was weaker as a share image).
  `page-metadata.ts` DEFAULT_IMAGE now `/opengraph-image.jpg`; project page uses it too (Home keeps the file convention).
  `seoCopy.og` trimmed to what is used + `card`. Tests in `src/components/seo/seo.test.ts` updated and extended.
- [ ] Step 4: verify
- [x] Step 4 DONE 2026-10-28 (not committed). typecheck, lint (0 warnings), vitest (64 files, 686 tests) green;
  `NEXT_DIST_DIR=.next-og npm run build` green, prod server on port 3177 curled (killed): Home has og:image (hashed
  file URL), og:image:type/width/height/alt, twitter:card summary_large_image, twitter:image (+type/width/height/alt),
  og:title, og:description; /projects, /projects/shiv-shiva, /about, /contact carry the same set with
  `/opengraph-image.jpg`. Image 1200x630 JPEG, 145.3 KB. Mocks in /private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/og/ (mock-whatsapp-300.png, mock-square-crop.png,
  mock-linkedin-card.png). Rebuild the card: `node tools/og/build-og-card.mjs` (needs Google Chrome).
- Notes for the director: origin comes from NEXT_PUBLIC_SITE_URL, else VERCEL_PROJECT_PRODUCTION_URL, else localhost
  (layout.tsx, not touched); confirm one of the first two is set on Vercel or og:image is a localhost URL. Static
  metadata images are served `max-age=0, must-revalidate`. `seo.ogMediaId` in shiv-shiva.ts is now unused by OG.
