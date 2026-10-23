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

## 2026-10-22 update
- Committed: map (6570604), diorama ghost fix + linear garden (3ef00fb), gold palette candidates (fb96a0d).
- Darshit picked palette 1 (Champagne and Espresso): see DECISIONS.md. Not applied yet.
- Hero B paused (docs/handoff/hero-b.md); one Omni call seg5-omni-sb2 left running on its own. Hero A paused (docs/handoff/hero-a.md).
- Logo agent was told to deliver what it has into brand/logo-concepts/.
- Resuming the agents reloads their whole history: about 60% of a Pro window for five agents at once. Resume at most two at a time.
- Palette 1 applied to tokens + viewport themeColor (213b673, develop only). Screenshots: light/dark home look right.
  Left: plan.css chapter panel is still a grey translucent box; explorer.css, diorama scene colours, lightbox, OG card, app icon.
- Logo agent drew nothing yet; plan and tooling in brand/logo-concepts/ (32033f5). Next: draw the 10, boards, overview sheet.
- Stopped at 86% of the window (2026-10-22, resets 19:10 IST). Next window, two agents at a time:
  1) logo agent (draw), 2) one hero agent (A first: SEG34_READY), then theme restyle of the leftovers, then develop to main with Darshit.

## 2026-10-23 update
- Logos: nine concepts committed (13a68ef). Darshit picked 05 Sheltering Arch (DECISIONS.md). Next: refine 05, then favicon,
  app icon, header mark, OG card, signboard, letterhead.
- Hero: seg3 = seg3-omni-aligned-3b (Omni), seg4 = seg4-veo-aligned-4b (Veo), seg4b = seg4b-glide; SEG34_READY.json written;
  review sheet _source/generated/video/hero/previews/seg34-review.jpg. Next: Hero B builds the final edit (hero-b.md step 2).
- Burn rate: two Opus max agents use about 2% of the Pro window per minute (about 35 minutes of work per window).

## 2026-10-23 evening · stopped at 93% (Darshit's cap: 95%)
- Usage can jump 20% in 5 minutes; with two max-effort agents, start the wrap at 70% and poll every 3 to 4 minutes after 60%.
- Logo agent (stopped mid-mockups): brand/logo/ (svg, png, brand-sheet.png, mockups in progress, README), site integration
  uncommitted: src/components/ui/Logo.tsx, logo-data.ts, logo.test.tsx, icon.svg, favicon.ico, apple-icon.tsx, og-card.tsx,
  SiteHeader/MobileMenu/SiteFooter, globals.css, copy/seo.ts. Verify (typecheck, lint, test, build, screenshots) before committing.
- Hero agent (stopped): tools/imagegen/hero_edit.json, hero_motion.py, hero_strip.py, assemble_hero.py edits, hero-b.md updated.
  Final encodes not confirmed yet; zz-test files still present.
- Everything is on wip/agents-snapshot. develop untouched since 96ae583.
