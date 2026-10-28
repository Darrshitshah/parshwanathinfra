# Colour lead handoff: three gold palettes (light + dark) on the current layout

Status (2026-10-22, delivered on the usage stop): three palettes designed, refined once after a real-site review,
contrast-checked. The overview sheet is rendered; the per-variant sheets are NOT rendered yet (script ready).
Nothing in `src/` was changed, no commits. `tsconfig.json` and `next-env.d.ts` are back to their pre-run state (the
remaining `tsconfig.json` diff is another agent's `.next-fix2` auto-edit). The dev server is stopped and `.next-colour` deleted.

## Files
Durable copy (survives scratch wipes): `docs/handoff/colour-lead/`
- `variant-1.css`, `variant-2.css`, `variant-3.css`: full token overrides (all colour tokens, light, dark and system
  default), same selectors as `src/styles/tokens.css`. Applying one is a tokens-only change.
- `palettes.mjs` (source of truth), `contrast.txt` (every pair checked), `gold-previews-sheet.jpg` (overview, 2400 px).
  Caveat: this overview was rendered mid-capture, so a few frames are round 1 and its rows use the hero first screen.
Scratch (`/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/colour-lead/`):
`gen.mjs` (writes CSS + contrast), `capture.mjs` (real-site shots, variant injected), `sheets.mjs` (sheets + PNG export),
`shots/` (round 1 complete for all variants; round 2 partial).

## Palettes (round 2, final candidates)
Band = `--block-mist`, Feature = `--block-jewel`, Close = `--block-ink`, Button = `--brick` / label `--on-brick`,
Accent = `--brick-ink`, Gold script = `--script-night`, Wordmark/feature text = `--on-jewel`.

| | 1 Champagne and Espresso | 2 Antique Gold and Bottle Green | 3 Saffron and Kumkum |
|---|---|---|---|
| L paper / ink / muted | #f6efe2 / #231a12 / #5e5144 | #f2eada / #0f2a1f / #44574c | #f9f1e1 / #2a150c / #654b3c |
| L band / feature / close | #e7d7b6 / #2f2118 / #17110c | #e4d2a4 / #0f3d2e / #0a1d16 | #f0d9ae / #5c1310 / #1c120c |
| L button / label / accent | #a58039 / #160f08 / #7a5518 | #9a7a36 / #06130d / #6e521c | #b9831a / #24120a / #8a5207 |
| L on-jewel / gold script | #f1dfb9 / #e7c57e | #eedfb6 / #dcbc72 | #f9e3b8 / #f2b851 |
| L plan flats, rows, shops, mixed | #235a85 #983a26 #a9861f #b8507f | #1e4d72 #9e3a22 #ab881f #b5527e | #26508a #a0331e #ad8a1c #b8457f |
| D paper / ink / muted | #120e0a / #f3e9d6 / #bfb09a | #07130e / #efe6cf / #b2ae98 | #0e0b08 / #f8ecd6 / #c4b098 |
| D band / feature / close | #2a231a / #35261a / #0a0807 | #0f2b21 / #0f4030 / #030a07 | #111a2c (midnight navy) / #4e100d / #0a0705 |
| D button / label / accent | #d9b263 / #1a1207 / #ebcf8f | #cfae63 / #0a1a12 / #dcc07f | #f0b440 / #1a0f05 / #f5c25a |
| D plan flats, rows, shops, mixed | #b0d4f2 #ec8668 #f3d680 #d36fa9 | #b0d4f2 #ef8c6c #f2d47c #e08abb | #b3d2f4 #f29274 #f5d47a #e07fb9 |
| Curtain L (sheen base deep title) | #a87c35 #7c5620 #3a250c #f8ecd2 | #2a6a50 #0f4433 #05241a #f0deb0 | #a3271c #6e1410 #3a0807 #fbe9c8 |
| Curtain D | #a57a33 #6b4a1a #2e1e0a #f6e8c9 | #1f5a44 #0c3a2b #031a12 #ecd9a8 | #8f2018 #5a100c #2a0505 #f8e3bd |
| Curtain is | burnished gold-bronze | bottle green | stays deep red (warmer kumkum) |

Contrast: every text pair passes WCAG AA in all six themes (body, muted, accent/script, button labels, header glass
over hero/paper/feature/close, map card, curtain title); lowest 4.6:1. Advisory only (non-text, button has a label):
the light gold pills sit at 2.4 to 3.3:1 against paper/band, and the map pin at 2.6 to 3.0:1 (it also has a halo, a ring
and a "Site" label). Typology: min dE2000 25/18 (normal/deuteranope) light, 27/12 dark, vs 23/8 today.

Review notes (round 1 shots): V1 dark and V2 dark are the strongest ("gold leaf at night"); V1 light is a warm
chocolate-box champagne; V2 light needed a gold pill (done in round 2); V3 light read caramel/rust (moved to saffron-gold
in round 2); V3 dark navy band is bold (navy, crimson, gold): verify in round 2 shots. My lean: 1 overall, 2 as the
heritage alternative.

## Missing / next steps
1. Start `NEXT_DIST_DIR=.next-colour npx next dev -p 3109` (back up `next-env.d.ts` and `tsconfig.json` first, restore after).
2. `node capture.mjs variant-1,variant-2,variant-3 light,dark` and `node capture.mjs current light,dark --only=d-num,d-plan`.
3. Review round 2; in `sheets.mjs` switch the overview rows to palette-revealing frames (`d-rows` or `d-num`, `p-30`).
4. `node gen.mjs && node sheets.mjs` -> `sheets/gold-previews-sheet.jpg`, `sheets/variant-N-sheet.jpg`, `export/`.
5. Not token-driven (needs a separate pass after Darshit picks): `layout.tsx` themeColor, diorama `scene-runtime.ts`
   TYPE_HEX and the `bg-[#f3efe7]` stage backgrounds (ScrollStage, StillFigure, StagePoster), `og-card.tsx`, `apple-icon.tsx`.
