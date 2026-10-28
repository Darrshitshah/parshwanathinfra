# fix-agent handoff (DONE)

## Issue 1: diorama ghost
Root cause: `Diorama.tsx` kept the overview still (object-cover, differently framed) permanently UNDER the transparent WebGL
canvas (`alpha: true`), so a larger faded second model showed through.
Fix: new `StagePoster.tsx` sits above the canvas, pointer-events-none, fades out (500 ms) after the live scene's first drawn frame,
then `invisible` and unmounted. `scene-runtime.ts` fires `onReady` after the first rendered frame; `SequenceCanvas.tsx` got `onDraw`
for Tier B. If WebGL fails the poster stays and the sequence takes over. Unit test: `StagePoster.test.tsx`.
Screenshots: scratchpad fix-agent/diorama-{before,after}-tier{A,B}-{1440,390}.png.

## Issue 2: linear garden card
No render showed it, so Nano Banana 2.1 strict edit of SS-30 (1 call, accepted first try). Script `tools/imagegen/linear_garden.py`;
original + prompt in `_source/generated/amenities/linear-garden.{png,prompt.txt}` (a1 copy kept); logged in `docs/IMAGEGEN_LOG.md`.
`public/media/linear-garden.webp` (1600x1073, 157 KB). Media entry added via `tools/images/media-manifest.mjs` (`kept` list, kind
generated, artistImpression true) and `build.mjs --no-encode` (build.mjs now passes `caption` for kept items). Amenity has
`mediaId: "linear-garden"`, evidence stays "plan". Schematic code, `schematicLabel/Note` copy removed; `mediaId` is now required in
`src/content/schema.ts`. Test in `src/app/pages.test.tsx` updated.

## Checks
typecheck, lint pass; vitest 64 files / 661 tests pass; `NEXT_DIST_DIR=.next-fix2 npm run build` passes; zero console errors in
screenshot runs. `.next-fix2` deleted, tsconfig.json reverted, dev server stopped. Nothing committed.
