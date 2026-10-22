# Colour lead handoff: three gold palettes (light + dark) on the current layout

Status (2026-10-22, checkpoint 0): resumed after the usage-limit stop. First-pass palettes exist (below) and pass the
WCAG text checks on paper, but they have NOT been looked at in the browser yet and no preview sheets exist yet.
The scratch folder was wiped during the pause; the scripts are being recreated.

Rules kept: `src/styles/tokens.css` and everything in `src/` untouched (previews inject CSS at screenshot time),
no commits, `tsconfig.json` auto-edits reverted, `next-env.d.ts` restored after each dev-server run.

## Where things are
Scratch: `/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/colour-lead/`
- `palettes.mjs` source of truth (solid colours), `gen.mjs` writes `variant-N.css` + `contrast.txt` + `tokens.json`
- `capture.mjs` real-site screenshots with a variant injected, `sheets.mjs` builds the JPG sheets
- Dev server for previews: `NEXT_DIST_DIR=.next-colour npx next dev -p 3109` (delete `.next-colour` after; restore `next-env.d.ts`)

## First-pass palettes (to be refined after the visual pass)
Token names are the ones in `src/styles/tokens.css`. Band = `--block-mist`, Feature = `--block-jewel`,
Close = `--block-ink`, Button = `--brick` (label `--on-brick`), Accent = `--brick-ink`, Gold script = `--script-night`.

| | 1 Champagne and Espresso | 2 Antique Gold and Bottle Green | 3 Saffron and Kumkum |
|---|---|---|---|
| Light paper / ink | #f6efe2 / #231a12 | #f2eada / #0f2a1f | #f9f1e1 / #2a150c |
| Light band / feature / close | #e7d7b6 / #33241a / #17110c | #e4d2a4 / #0f3d2e / #0a1d16 | #f0d9ae / #5c1310 / #1c120c |
| Light button / label / accent | #a37c37 / #160f08 / #74521e | #0f3d2e / #e8cd8c / #6e521c | #b9761c / #24120a / #8f480a |
| Light gold script | #e7c57e | #dcbc72 | #f2b851 |
| Dark paper / ink | #120e0a / #f3e9d6 | #07130e / #efe6cf | #0e0b08 / #f8ecd6 |
| Dark band / feature / close | #26221c / #33241a / #0a0807 | #0f2b21 / #0f4030 / #030a07 | #161b33 / #4e100d / #0a0705 |
| Dark button / label / accent | #d9b263 / #1a1207 / #ebcf8f | #cfae63 / #0a1a12 / #dcc07f | #f0b440 / #1a0f05 / #f5c25a |
| Curtain light (sheen, base, deep, title) | #a87c35 #7c5620 #3a250c #f8ecd2 | #2a6a50 #0f4433 #05241a #f0deb0 | #a3271c #6e1410 #3a0807 #fbe9c8 |
| Curtain dark | #a57a33 #6b4a1a #2e1e0a #f6e8c9 | #1f5a44 #0c3a2b #031a12 #ecd9a8 | #8f2018 #5a100c #2a0505 #f8e3bd |
| Curtain colour | burnished gold-bronze | bottle green | stays deep red (warmer kumkum) |

## Next steps
1. Recreate scripts, run the dev server, capture current + 3 variants, light and dark, desktop and phone (incl. the new
   Location map, `src/components/map`).
2. Iterate palettes until each looks luxurious (no muddy browns, gold used with restraint); re-run contrast.
3. Build `gold-previews-sheet.jpg` + `variant-N-sheet.jpg`, phone-readable; update this note with final hexes.
