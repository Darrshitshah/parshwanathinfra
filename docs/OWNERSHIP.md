# Ownership map

One writer per path. A lead that needs a change in another owner's path writes the request in its report; the Director
decides and routes it. Unit tests live next to the code and belong to the code's owner.

| Owner | Paths |
|---|---|
| Director | `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `src/app/layout.tsx`, `src/content/schema.ts` (+ test), `src/lib/device-tier.ts`, `src/lib/device-tier-provider.tsx` (+ test), `src/styles/tokens.css`, `tests/unit/**`, `.env.example`, `.gitignore`, git, Vercel, `docs/*` except the files named below |
| data-lead | `src/content/**` (except `schema.ts`), `public/media/**`, `public/plan/**`, `tools/pdf/**`, `tools/images/**`, `docs/DATA_NOTES.md` |
| motion-lead | `src/motion/**`, `src/components/transition/**`, `src/components/loader/**`, `src/components/cursor/**` |
| plan-lead | `src/features/plan/**`, `src/features/explorer/**` |
| scene-lead | `tools/blender/**`, `tools/imagegen/**`, `src/features/diorama/**`, `public/3d/**`, `public/sequences/**`, `docs/IMAGEGEN_LOG.md` |
| pages-lead | `src/app/**` (except `layout.tsx`, including `globals.css` and `src/app/api/**`), `src/components/**` (except the motion-lead folders) |
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

## Tech notes every lead must know

- **Next.js 16.4** with Turbopack and Tailwind v4. APIs differ from older versions: read the guide in
  `node_modules/next/dist/docs/` before writing Next code (`AGENTS.md`). Examples: `next/image` uses `preload` (not
  `priority`), `images.qualities` allows only 60, 75, 85; `LayoutProps` / `PageProps` are global types.
- `cacheComponents` is **off** (pages are fully static; no React Activity keeping old routes mounted).
- **Dash characters:** the file-writing tool turns `–` / `—` escapes into the literal characters, which then fail
  the no-dash test. When code must mention them, build them with `String.fromCharCode(0x2013)` / `(0x2014)`.
- Paths contain spaces and the project folder ends with a space: quote every path. The Director's session runs from the
  parent folder, so always `cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "` first and never run anything in
  the parent folder (a live trading workspace).
- Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (or `npm run check` for all four).
- Python tools run through uv (`~/.local/bin/uv run --no-project --python 3.12 --with <pkg> ...`); that is not a package
  install and is allowed inside your own `tools/` paths.
