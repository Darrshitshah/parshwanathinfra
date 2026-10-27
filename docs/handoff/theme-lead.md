# Theme lead handoff: finish the Champagne and Espresso switch

Started 2026-10-28. Scope: plan chapter panel, explorer.css + plan explorer UI, diorama stage chrome, lightbox,
3D scene colours, remaining raw colours in src/. No git except diff/status. Hero film files are not mine.

## Status
- Step 0: read docs, tokens, globals. (in progress)
- Step 0 done. Before shots: scratchpad `theme/before/` (capture script `theme/capture.mjs`, build served on 3122).
  Findings: (a) the plan chapter card is see-through because `tone-mist` sets `--paper-raised` from itself
  (`color-mix(..., var(--paper-raised))` = a cycle, so the value is invalid and every `bg-paper-raised` inside a mist
  block is transparent); (b) plan and explorer still use the drafting look (square hairline boxes); (c) diorama stage
  is ivory `#f3efe7` in both themes, roofs blue/orange/green/purple (the caption text names those hues, so the hue
  families stay; they are tuned to the palette); (d) desktop cursor dot uses `difference` blend, which reads navy on
  champagne; (e) explorer dialog scrim mixes `--ink` (cream at night).
- Step 1 done (not yet verified in a build): tokens.css gains `--mist-raised`, `--stage-bg` (light/dark) and root
  aliases `--theme-*` (root theme values that survive colour blocks); stale palette comments fixed. globals.css:
  tone-mist uses `--mist-raised` (fixes the transparent chapter card and every raised card on mist bands), warm
  shadows. plan.css: rounded stage, glass chapter card (desktop) / soft card (phone), pills for tools and chips,
  round typology badges, glass hotspot labels, plot card without the ink rule.
- Step 2 done (not yet verified): explorer.css soft surfaces, pill picker, rounded drawing, dialog uses `--scrim`.

## Scope change (coordinator, from Darshit): remove the 3D diorama entirely
Plan panel, explorer and lightbox restyle stays. Diorama restyle dropped (the scene-palette work was discarded with
the folder). Before numbers (build of the pre-change tree, `theme/jsweight.mjs`, home `/`, 1440):
tier A first-load JS 888.7 KiB raw / 292.2 KiB gzip, after a full scroll 1690.7 / 502.5; tier B 870.4 / 286.9,
full scroll 1038.3 / 337.9. Home eyebrows before: 01..09 with walk = 04. Before seam shots: `theme/before-removal/`.
- Removal done (pending verification): `src/features/diorama/` deleted; `src/components/home/Diorama.tsx`,
  `DioramaMount.tsx` (+ test) deleted; home copy `walk` + `RouteStop` removed; home eyebrows renumbered (amenities 04,
  row houses 05, location 06, gallery 07, visit 08; project page passes its own numbers, unchanged); `useNear` moved to
  `src/lib/use-near.ts`, and LivingPlanSlot / ExplorerSlot now use it too (their duplicate `plan/use-near-viewport.ts`
  deleted); `public/3d/` and `public/sequences/diorama/` deleted (tools/blender still writes there if re-run);
  stage tokens and `--theme-*` aliases removed again; npm uninstall three, @types/three and the unused
  @react-three/fiber + @react-three/drei (they need three; nothing imported them). Backup of the old package files:
  scratchpad `theme/package*.json`. OWNERSHIP.md scene-lead row updated.
- Removal verified: typecheck, lint, vitest (57 files, 627 tests before the new `src/lib/use-near.test.tsx`), build
  all pass. Home after (same method): tier A first-load JS 887.1 KiB raw / 291.9 KiB gzip (was 888.7 / 292.2),
  after a full scroll 1032.3 / 335.2 (was 1690.7 / 502.5: Three.js chunk gone); tier B first-load 868.8 / 286.6
  (was 870.4 / 286.9), full scroll 1014.1 / 329.9 (was 1038.3 / 337.9). Also no GLB (~0.9 MB) or 66-frame sequence
  (3.3 MB) downloads. Eyebrows now 01..08 without a gap; mist plan band meets the paper amenities sheet cleanly
  (`theme/after-removal/seam-*.png`).
- Iteration 1 (after shots `theme/after/`): flats read grey at 26% fill, so building fill 34%; phone typology keys get
  a short rounded colour dash instead of a curved top rule; pressed keys keep ink on hover; lightbox arrows are solid
  raised discs (glass over the photo turned muddy olive on phones). Rebuilding to verify.

## Final state (2026-10-28)
- Checks: `npm run typecheck` ok, `npm run lint` ok, `npx vitest run` 58 files / 629 tests pass (new
  `src/lib/use-near.test.tsx`), `NEXT_DIST_DIR=.next-theme npm run build` ok (only the known Zalando font-override
  warning). `tsconfig.json` reverted, `.next-theme` deleted, server on 3122 stopped.
- Screenshots (scratchpad `theme/`): `before/`, `after2/` (plan story + explore, explorer, unit plan, lightbox at
  390 and 1440, light and dark), `before-removal/` + `after-removal/` (home seam), `mist/` + `mist-sheet.jpg`
  (About, Contact, Projects, project Location: raised cards now visible after the tone-mist fix).
- Review sheet for Darshit: scratchpad `theme/theme-review.jpg` (1600 x ~7970, phone portrait).
- Left / notes: hotspot labels on the 390 plan can overlap each other (layout, pre-existing); the explorer's
  "Draw again" and plan `lp-link` keep their underline-link look; `tools/blender` still exports to `public/3d/` and
  `public/sequences/diorama/` if someone re-runs it; docs (BUILD_SPEC, PROGRESS, SWARM_PROMPT) still describe the
  diorama (S4) and were not edited; `@gltf-transform/cli` (dev, tools only) kept.
