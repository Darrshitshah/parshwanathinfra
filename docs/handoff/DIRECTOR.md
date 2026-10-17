# Director handoff (2026-10-17, usage limit close)

Six agents were wrapped up at once to save their work before the 5-hour limit. Each one writes its own note here.

| Agent | Brief | Note |
|---|---|---|
| Hero A (Opus max) | align keyframes to the stage-3 camera, seg3/seg4 A/B, seg4b glide; writes _source/generated/video/hero/SEG34_READY.json | docs/handoff/hero-a.md |
| Hero B (Sonnet max) | seg5, tools/imagegen/assemble_hero.py, public/video/hero encodes + poster + manifest, public/sequences/hero | docs/handoff/hero-b.md |
| Colour lead (Opus max) | three gold palettes, light + dark, on the current layout | docs/handoff/colour-lead.md |
| Map (Sonnet) | Google Maps satellite map in our theme, themed no-key fallback (src/components/map, src/lib/google-maps.ts) | docs/handoff/map.md |
| Fix (Sonnet) | diorama ghost still behind the canvas (StagePoster), linear-garden card image | docs/handoff/fix-agent.md |
| Logo (Opus max) | 10 logo concepts in brand/logo-concepts/ with an overview sheet | brand/logo-concepts/README.md |

## Where the work is saved
- Everything on disk was snapshotted to the branch `wip/agents-snapshot` (pushed to GitHub). It is a backup, not for Vercel.
- `develop` holds only verified commits (last: 97f307a). `main` is production and needs Darshit's approval.
- `_source/` (keyframes, clay renders, Veo/Omni takes) is gitignored on purpose; it stays on this Mac and in gs://parshwanath-infra-veo.
- `tsconfig.json` diff is Next's auto-edit from an agent build dir: revert with `git checkout -- tsconfig.json` before committing.

## Resume order
1. Read each agent note. Verify (typecheck, lint, test, build), then commit by explicit path to develop.
2. Send Darshit: logo sheet, gold palette sheets, map key steps, hero takes.
3. After he picks a palette: apply tokens, restyle plan.css / explorer.css / diorama chrome / lightbox, update viewport themeColor in layout.tsx, then develop to main with his approval.
