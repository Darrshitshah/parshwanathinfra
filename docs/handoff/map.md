# Map handoff: themed street map (MapLibre + OpenFreeMap, no key)

Darshit chose (2026-10-28): a real, zoomable street map drawn in the site's colours, with no API key. This replaces the
Google satellite plan (never had a key). Agent: map2 front-end designer. Not committed (the director commits).

## Status (update after each step)
- [x] Step 0: read the code, baseline build. Home first-load JS before: 204.1 KB gz (11 scripts, sum of gz of every
  `<script src>` in `.next-map2/server/app/index.html`); contact 228.3 KB. Note: another agent has uncommitted hero
  edits (globals.css, Hero.tsx, en.ts) in the tree at the same time, so compare script lists, not only totals.
- [x] Step 1 (code written, not yet verified in a browser): `map-style.ts` (style JSON from tokens), `map-colour.ts`,
  `map-camera.ts`, `map-support.ts` (WebGL + save-data gate), `map-runtime.ts` (token reader, theme watcher),
  `SiteMapCanvas.tsx` (MapLibre, pin, glass controls, cooperative gestures, own credit line), `SiteMap.tsx` (shell),
  `site-map.css` (gold pin, gesture veil, credit), fonts in `public/map/fonts/` (Zalando Sans Expanded latin 400/600
  static instances cut with fontTools from the next/font file, plus latin-ext).
- [x] Step 2 (code): removed `src/lib/google-maps.ts` + test and the `NEXT_PUBLIC_GOOGLE_MAPS_*` lines; LocationMap always
  renders the shell; copy `home.ts` (body, `liveCaption`, gestures, attribution), `legal.ts` (privacy: OpenFreeMap
  receives IP; disclaimer: OSM data, ODbL, indicative). Card now bottom-left in both states.
- [x] Step 1b, browser-verified on the dev server (port 3123, `.next-map2-dev`): worker loads via
  `new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url)` (Turbopack emits it), fonts draw in Zalando.
  Fixes found by eye: MapLibre's `.maplibregl-map{position:relative}` beats Tailwind's `absolute`, so the map container
  is `size-full` inside a positioned wrapper; opening zoom is fitted on `load` (frame measured); the gold road is a
  static trace (`vapi-silvassa-road.json`, from `tools/map/trace_road.py`) because tiles carry SH185 only from z12;
  below z12 the road name is one rotated tag (line labels cannot span tile pieces at low zoom); card is overlaid only
  when the frame is 42rem+ (container query), so /contact's narrow column gets it below; tokens read on <body> so the
  map looks the same on every colour block; pin tag sits above the pin in narrow frames.
- [ ] Step 2b: rewrite `map.test.tsx`, update `pages.test.tsx`, add unit tests for style/colour/camera
- [ ] Step 3: checks, build, size after, screenshots, review sheet

## Facts found
- `maplibre-gl@6.13.0` was already in package.json (scaffold) but unused. v6 is ESM only and spawns its worker from a
  separate file (`maplibre-gl-worker.mjs`, self-contained), so the worker URL has to be set with `setWorkerUrl`.
- v6 supports the style property `font-faces`: labels can be drawn locally from our own font file (TinySDF), so the map
  uses Zalando Sans Expanded (the site's sans, OFL) from `public/map/fonts/`, falling back to OpenFreeMap's glyph PBFs
  for scripts the file does not cover.
- OpenFreeMap TileJSON `https://tiles.openfreemap.org/planet` (OpenMapTiles schema, maxzoom 14), glyphs
  `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`. No sprite is used (no icons).
- In OSM the Vapi-Silvassa Road near the site is `SH185` (primary, unnamed, about 90 m from the pin); west of Vapi the
  same ref is "Daman Road". The style emphasises SH185 only inside a box east of Vapi.
- No CSP or security headers exist anywhere (next.config.ts has none, no middleware/proxy, no vercel.json).
