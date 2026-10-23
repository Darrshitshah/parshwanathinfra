# Parshwanath Infra · final logo (05 Sheltering Arch)

Status: checkpoint 3 (2026-10-23). Logo files built and on the site (header, mobile menu, footer, icons, OG card);
typecheck, lint, 665 tests and the production build pass. Next: brand sheet and mockups.

## Decisions so far (from rendered studies in the scratch folder `scratchpad/brand/work/`)
- Mark: the seven lobes are rebuilt so all seven share ONE radius. The two shoulder lobes are tangent to the jambs at
  the springline, the five crown lobes sit between cusps on a circle concentric with the arch (the cusp angles are
  solved numerically). The concept's lobes were deeper than half circles (bubbly, "cloud"); now depth 0.42 of the
  chord, so they read as carved cusps. Jamb 15, crown band 13.5 (slightly lighter at the top, optical), cusps at
  0.88 of the inner radius, rise 80, otla overhang 12, gap 5, thickness 11 (outer radius 50).
- Wordmark: Cormorant Garamond 600 caps kept from the concept (heritage, warm; Playfair was tested and is the site's
  display face, but reads as fashion). PARSHWANATH tracked 0.08 em. INFRA at 0.45 of its cap height, tracked 0.5 em,
  centred between two fine rules that run to the full width of the name: the rules echo the otla.
- Horizontal lockup: the cap top of PARSHWANATH sits on the arch's springline and INFRA stands on the same ground as
  the otla (its baseline on the otla's base line). Stacked: name 2.8x the mark's width, one cap height below it.
- Favicon: a heavier small mark on a 16 unit grid (crisp at 16 and 32 px), same seven lobes, thicker otla and gap.

## Done (checkpoint 2)
- `svg/`: mark, horizontal, stacked in espresso, gold, champagne, white, warm-gold; horizontal and stacked duo (gold
  mark, ink name) light and dark; favicon.svg (adaptive), favicon-tile.svg, favicon-tile-plain.svg. All outlined.
- `png/`: every SVG colourway as PNG (mark 1024 tall, horizontal 2400 wide, stacked 1600 wide), favicon 16/32/48,
  favicon.ico, apple-touch-icon-180, icon-192, icon-512, avatar-espresso-1080, avatar-champagne-1080.
- Site: src/app/icon.svg, src/app/favicon.ico, src/components/ui/logo-data.ts (generated outlines).
- Rebuild: `sh brand/logo-concepts/_build/py.sh brand/logo/_build/build.py && node brand/logo/_build/export.mjs`

## Done (checkpoint 3): website
- `src/components/ui/Logo.tsx` (+ `logo.test.tsx`): mark and name as two currentColor SVGs of one height
  (`--logo-h`), so the lockup alignment holds at any size; `label` makes it one named image, otherwise decorative.
- Header: mark from 0 px, name from sm up, 36 px (40 px from md) tall, inside the home link (aria-label kept).
  Mobile menu: full lockup with a gold mark. Footer: full lockup (56 px, 72 px from lg) with a gold mark, then the
  tagline (the separate display-serif name was removed: the lockup carries it).
- `src/app/apple-icon.tsx`: warm gold mark on espresso. `src/components/seo/og-card.tsx`: champagne palette, the
  lockup (gold mark, espresso name) replaces the old roundabout and eyebrow; `seoCopy.og.eyebrow` removed.
- The round Seal component stays only where it is a decorative township stamp (home hero, enquiry band).
- Screenshots: `scratchpad/brand/` (header, footer, menu at 390 and 1440, light and dark; favicons; OG images).

## Next step
- Brand sheet (`brand-sheet.png`), mockups (gate signboard, letterhead), usage notes below.
