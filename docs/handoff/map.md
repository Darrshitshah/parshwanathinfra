# Map handoff: Google satellite view for the location section

Status: code done, typecheck + lint + tests green (last run). Not committed. Not yet verified with a real key (none exists).

## What changed
- New `src/lib/google-maps.ts` (+ `.test.ts`): key/Map ID reading, documented bootstrap URL (`loading=async&callback=`), on-demand loader with timeout and retry, `gm_authFailure` hook, `buildMapOptions` (hybrid satellite, `disableDefaultUI`, cooperative gestures, centre = content geo). No npm package added.
- New `src/components/map/`: `SiteMap.tsx` (client shell, IntersectionObserver via `features/diorama/use-near`, lazy-imports the canvas), `SiteMapCanvas.tsx` (lazy: loads API, Advanced Marker, our glass zoom/recenter controls, reduced-motion aware), `MapShell.tsx`, `SiteInfoCard.tsx` (glass card, name/address/coords/links), `SchematicFallback.tsx` (restyled schematic, "Not to scale"), `place.ts` (reads content), `site-map.css` (themed pin), `map.test.tsx`.
- `src/components/home/LocationMap.tsx` now the entry: no key = pure server fallback (no map JS, no Google request); key = SiteMap. `Location.tsx`: body copy switches with key, duplicate link row removed (links live in the card). `contact/page.tsx`: `<LocationMap links={false} />` (page already lists links).
- Copy: `src/content/copy/home.ts` (`bodyMap`, `satelliteCaption`, `map` labels), `src/content/copy/legal.ts` (map wording now "indicative", imagery by Google).
- `.env.example`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, optional `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.

## Checks
- `npm run typecheck`, eslint on touched dirs, `vitest` for google-maps, map, pages tests: pass. Full `npm test` passed earlier (659) before the last small edits (link row removal, pill change); re-run it.
- Build (`NEXT_DIST_DIR=.next-map`) passed. Home first-load JS (sum gz of index.html scripts): baseline copy of tree without my change 197.2 KB, with my change 197.5 KB (+0.3 KB, SiteMap shell; map canvas and Google script are lazy). Under the 200 KB budget but not zero growth.
- Screenshots (no-key fallback, before the last tweak that removed the site name pill and moved the road inward): `/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/map-agent/shots/location-{390,1440}-{light,dark}.png`. Re-shoot with `scratchpad/map-agent/shot.mjs` after `NEXT_DIST_DIR=.next-map npx next dev -p 3112`.

## Darshit: Google Cloud and Vercel steps
1. Google Cloud project `my-jev-autonomous-agent`: enable billing, then APIs & Services > Library > enable "Maps JavaScript API".
2. Credentials > Create credentials > API key. Restrict it: Application restrictions = Websites, referrers `https://parshwanathinfra.vercel.app/*` and `http://localhost:*`; API restrictions = Maps JavaScript API only.
3. Optional but recommended: Google Maps Platform > Map Management > create a Map ID (JavaScript, Raster or Vector); needed for Advanced Markers in production. Without it Google's `DEMO_MAP_ID` is used.
4. Vercel > Project > Settings > Environment Variables: add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`), then redeploy (values are inlined at build). Put the same in `.env.local` for local dev.

## Left to do
- Test with a real key: marker, controls, cooperative gestures on a phone, light and dark, attribution visible and not covered by our UI.
- Re-run `npm test`, full build and the screenshots; re-check size number.
- Risks: each map load is billed (Dynamic Maps SKU) after the free tier, though it loads only near the viewport; Google terms require logo and attribution to stay visible and no filter on imagery (both respected); `useNear` is imported from `features/diorama` (another agent's file).
- A pages.test assertion still expects "not to scale" and an svg role=img: holds in the no-key state only.
