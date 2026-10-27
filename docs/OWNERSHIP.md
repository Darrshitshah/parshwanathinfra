# Ownership map

One writer per path. A lead that needs a change in another owner's path writes the request in its report; the Director
decides and routes it. Unit tests live next to the code and belong to the code's owner.

| Owner | Paths |
|---|---|
| Director | `tools/dev/**`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `src/app/layout.tsx`, `src/content/schema.ts` (+ test), `src/lib/device-tier.ts`, `src/lib/device-tier-provider.tsx` (+ test), `src/styles/tokens.css`, `tests/unit/**`, `.env.example`, `.gitignore`, git, Vercel, `docs/*` except the files named below |
| data-lead | `src/content/**` (except `schema.ts`, `i18n/` and `copy/`), `public/media/**`, `public/plan/**`, `tools/pdf/**`, `tools/images/**`, `docs/DATA_NOTES.md` |
| motion-lead | `src/motion/**`, `src/components/transition/**`, `src/components/loader/**`, `src/components/cursor/**`, `src/app/motion-lab/**` (dev-only review route) |
| plan-lead | `src/features/plan/**`, `src/features/explorer/**` |
| scene-lead | `tools/blender/**`, `tools/imagegen/**`, `public/video/**`, `public/sequences/**`, `docs/IMAGEGEN_LOG.md` |
| pages-lead | `src/app/**` (except `layout.tsx` and `motion-lab/`, including `globals.css` and `src/app/api/**`), `src/components/**` (except the motion-lead folders), `src/content/i18n/**` (UI strings), `src/content/copy/**` (page copy that is not a fact), `src/features/enquiry/**` |
| qa-lead | `tests/e2e/**`, `playwright.config.*`, `lighthouserc.*`, `docs/QA_REPORT.md` |

## Contracts (Director, Phase 0)

Leads build against these and never edit them; ask for changes in REQUESTS.

- `src/content/schema.ts`: zod schemas and types for site, project, plan (`plan.json`, `transform.json`, chapters), units,
  inventory, media. `orTbd()`, `isTbd()`, `TBD`, and `copy` (rejects em and en dashes).
- `src/lib/device-tier.ts` + `device-tier-provider.tsx`: `useDeviceTier()` returns `{ tier: "A"|"B"|"C", ready, reducedMotion,
  finePointer, touch, webgl2, saveData, smoothScroll }`. Server and first client render get Tier C with `ready: false`: render
  the static version first and enhance after `ready`. QA override: `?tier=A|B|C` (sticky for the session), `?tier=auto` clears.
- `src/motion/index.ts`: `registerMotion`, `EASE`, `DURATION`, `inkDraw`, `splitReveal`, `dimensionCount`, `boundaryCurtain`,
  `roundaboutIris`, `boulevardWipe`, `stripBlinds` (names and signatures fixed; motion-lead implements the bodies).
- `src/motion/MotionRoot.tsx` (motion-lead) and `src/components/shell/SiteShell.tsx` (pages-lead) are mounted by `layout.tsx`:
  keep their export names and `{ children }` props.
- `src/styles/tokens.css`: look A "Drafting table" tokens, light and dark. Tailwind utilities: `bg-paper`, `text-ink`,
  `text-ink-muted`, `border-line`, `text-brick`, `bg-brick`, `text-on-brick`, `fill-flats` and the other typology colours,
  `font-display` (Instrument Serif), `font-sans` (Inter Tight), `font-mono` (JetBrains Mono), `ease-draft`.
  `--ink-faint` and `--status-tbd` are for lines and fills only (below AA as text).

## Seeded content (Director, Phase 0, handed to data-lead)

`src/content/site.ts`, `projects/index.ts`, `projects/shiv-shiva.ts`, `inventory.ts`, `media.ts` (+ `content.test.ts`) and
`public/media/*.webp` were seeded from SOURCE_PACK and the portfolio's 1600 w web renders so pages could start at once.
Import them, e.g. `import { shivShiva } from "@/content/projects"`, `import { getMedia } from "@/content/media"`,
`import { site } from "@/content/site"`, `import { en } from "@/content/i18n/en"`. Media ids stay stable when data-lead upgrades
the files to the 4K photoreal masters.

## Parallel work: build dirs and ports

Never run `next build` or `next dev` with the default `.next` folder while other agents work. Use your own:

| Agent | Build | Dev server |
|---|---|---|
| Director | `NEXT_DIST_DIR=.next-director npm run build` | `NEXT_DIST_DIR=.next-director npx next dev -p 3100` |
| data-lead | `NEXT_DIST_DIR=.next-data npm run build` | `NEXT_DIST_DIR=.next-data npx next dev -p 3101` |
| motion-lead | `NEXT_DIST_DIR=.next-motion npm run build` | `NEXT_DIST_DIR=.next-motion npx next dev -p 3102` |
| pages-lead | `NEXT_DIST_DIR=.next-pages npm run build` | `NEXT_DIST_DIR=.next-pages npx next dev -p 3103` |
| plan-lead | `NEXT_DIST_DIR=.next-plan npm run build` | `NEXT_DIST_DIR=.next-plan npx next dev -p 3104` |
| scene-lead | `NEXT_DIST_DIR=.next-scene npm run build` | `NEXT_DIST_DIR=.next-scene npx next dev -p 3105` |
| qa-lead | `NEXT_DIST_DIR=.next-qa npm run build` | `NEXT_DIST_DIR=.next-qa npx next dev -p 3106` |

Start dev servers in the background and stop them when you finish (`kill` the PID you started; never kill other agents'
servers). Screenshots: `node tools/dev/shot.mjs --url http://localhost:<port>/<path> --out "<your scratch dir>" --name <n>`
captures 360 px and 1440 px, with and without reduced motion, and reports console errors and horizontal overflow
(`--tier A|B|C` forces a tier, `--scroll 0.5` scrolls first, `--full` for full page). Another agent's half-finished files can
break your build for a moment: if an error is in a path you do not own, wait a minute and retry before reporting it.

## Tech notes every lead must know

- **Next.js 16.4** with Turbopack and Tailwind v4. APIs differ from older versions: read the guide in
  `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`). Examples: `next/image` uses `preload` (not
  `priority`), `images.qualities` allows only 60, 75, 85; `LayoutProps` / `PageProps` are global types.
- `cacheComponents` is **off** (pages are fully static; no React Activity keeping old routes mounted).
- **Dash characters:** the file-writing tool turns JavaScript unicode escapes for U+2013 and U+2014 into the literal characters, which then fail
  the no-dash test. When code must mention them, build them with `String.fromCharCode(0x2013)` / `(0x2014)`.
- Paths contain spaces and the project folder ends with a space: quote every path. The Director's session runs from the
  parent folder, so always `cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "` first and never run anything in
  the parent folder (a live trading workspace).
- Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (or `npm run check` for all four).
- Python tools run through uv (`~/.local/bin/uv run --no-project --python 3.12 --with <pkg> ...`); that is not a package
  install and is allowed inside your own `tools/` paths.
