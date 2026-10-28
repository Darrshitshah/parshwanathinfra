# Cursor handoff: crisp, premium cursor

Brief (Darshit): the cursor circle looks "very low res"; make it clear and more premium. Not committed (the director commits).

## Status: DONE 2026-10-28, all checks green, not committed
- [x] Step 0: root cause verified (zoomed "before" crops show a soft, fat 4 px stroke)
- [x] Step 1: new cursor (hairline ring + solid core + labelled disc, all drawn at real size, never scaled)
- [x] Step 2: tests (cursor-geometry.test.ts added), typecheck, lint, vitest (683 pass), build (NEXT_DIST_DIR=.next-cursor)
- [x] Step 3: browser check at dsf 1, 2, 3 (Chrome channel), light and dark, hero, link, label, pressed

## Root cause
.pi-cursor__shape was 14 px and GSAP scaled it to 2.8 (labelled disc: 0 to 1) under will-change: transform, so the browser
rasterised the small layer and stretched the bitmap. Sub-pixel x/y (e.g. 602.953px) on a promoted layer added bilinear softness.

## Changes (src/components/cursor/)
- cursor-geometry.ts (new, pure): sizes (ring 30/64, core 6, disc 88, all even px, smaller when pressed), motion profile
  (core 0.08 s, ring 0.28 s, disc 0.34 s follow; elastic.out(1, 0.8) grow; reduced motion = zero lag, no spring), device-pixel snap.
- cursor-motion.ts (new): GSAP wiring. Sizes are CSS vars (--pi-size, --pi-disc) tweened, so the browser redraws at device
  resolution. Followers use gsap.ticker exponential smoothing and snap to device pixels. (gsap.quickTo with modifiers did not move the layers.)
- Cursor.tsx: three layers (ring, core, disc). Also fixes a bug: hovering a labelled element before the first pointer move left the cursor invisible.
- cursor.css: real width/height from the vars, 1 px ink line + champagne outer edge (reversed at night), no will-change, crisper label text.
- cursor-geometry.test.ts (new). CursorSection.tsx: copy only.

## Screenshots (scratchpad .../scratchpad/cursor/)
before-dsf{1,2}-sheet.png, after-dsf{1,2,3}-sheet.png; zoom: before-zoom-link.png, after-zoomB.png. Script: shot.mjs, motion.mjs.
Motion trace: ring 30 to 64 on link, one 4.7% overshoot, 60 fps, max frame gap 19 ms.
