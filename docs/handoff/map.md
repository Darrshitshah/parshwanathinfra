# Map handoff: themed street map (MapLibre + OpenFreeMap, no key)

Darshit chose (2026-10-28): a real, zoomable street map drawn in the site's colours, with no API key. This replaces the
Google satellite plan (never had a key). Agent: map2 front-end designer. Not committed (the director commits).

## Status (update after each step)
- [x] Step 0: read the code, baseline build. Home first-load JS before: 204.1 KB gz (11 scripts, sum of gz of every
  `<script src>` in `.next-map2/server/app/index.html`); contact 228.3 KB. Note: another agent has uncommitted hero
  edits (globals.css, Hero.tsx, en.ts) in the tree at the same time, so compare script lists, not only totals.
- [ ] Step 1: style JSON from tokens, canvas, pin, controls, attribution
- [ ] Step 2: remove the Google path, tests, copy
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
