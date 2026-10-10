# Build progress

Status: IN PROGRESS · Phase 1 (started 2026-10-10). When everything below is ticked and Darshit has the final preview, write
"BUILD COMPLETE" on the status line.

Each line: `- [x] item · commit <hash> · preview <url> · <date>`.

## Phase 0 · Director
- [x] Kickoff popup answered, decisions logged · 2026-10-10
- [x] Auto-resume task created (if chosen) · `parshwanath-build-resume`, hourly · 2026-10-10
- [x] Tools verified (node, npm, git, uv, PyMuPDF extract in _source/cad) · 2026-10-10
- [x] git init on develop, remote added, first push · local only (Q1: GitHub later) · commit b6894e7 · 2026-10-10
- [x] Next.js scaffolded, all packages installed · commit b6894e7 · 2026-10-10
- [x] Contracts: schema.ts, device-tier.ts, motion/index.ts stubs, tokens.css, OWNERSHIP.md · commit b6894e7 · 2026-10-10
- [ ] Vercel connected, first preview link · deferred until Darshit connects GitHub (Q1); preview = local `npm run dev`

## Phase 1 · data-lead, motion-lead, pages-lead (shell)
- [ ] CAD layer map and transform.json (residuals logged)
- [ ] plan.json (sectors 01 to 05, roads, row-house district, plots 1 to 165, amenities)
- [ ] Web plan SVG and chapters.ts
- [ ] Unit plan SVGs
- [ ] Content files with facts and TBDs
- [ ] Image pipeline and deep-zoom tiles
- [ ] Motion setup, primitives, transitions
- [ ] S1 loader, S8 cursor
- [ ] Layout shell, nav, footer, enquiry drawer UI
- [ ] All pages as static sections

## Phase 2 · plan-lead, scene-lead, pages-lead, motion-lead
- [ ] S3 Living Plan
- [ ] S5 Building explorer
- [ ] Blender module installed, scene built, stills, sequence, GLB
- [ ] S4 Diorama (WebGL, sequence, still)
- [ ] Generated images (cloud plates, dusk pair, icons, OG)
- [ ] S2 sky descent mounted and choreographed
- [ ] S6 row-house street
- [ ] Enquiry API, SEO, legal pages, 404

## Phase 3 · qa-lead and fixes
- [ ] QA_REPORT.md written
- [ ] Fix round 1
- [ ] Fix round 2
- [ ] Fix round 3 (if needed)
- [ ] Budgets met: Lighthouse mobile ≥ 85 / 95 / 95 / 95, LCP < 2.5 s, CLS < 0.1

## Phase 4 · Director
- [ ] README, QUESTIONS.md, DECISIONS.md complete
- [ ] Final preview link sent to Darshit
- [ ] Auto-resume task deleted

## Log
- 2026-10-10 00:58 IST · Phase 1 leads started (data, motion, pages), each in its own build dir and port.
- 2026-10-10 01:0x IST · Usage limit hit; all three leads stopped mid-step (work on disk kept). Headless Blender (`bpy` 5.2.2 LTS) installed in `tools/.venv-blender` for Phase 2.
- 2026-10-10 04:52 IST · Limit reset; the three leads resumed with their context.
- 2026-10-10 ~05:30 IST · Usage limit hit again mid-Phase 1 (pages-lead was building SiteShell, motion-lead wiring transitions, data-lead re-checking files).
- 2026-10-10 11:17 IST · Limit reset; the three leads resumed with their context.
- 2026-10-10 15:46 IST · Usage at 88% after ~11 min of three max-effort leads (~8%/min). Leads stopped, work checkpointed. Next window resets 19:50 IST.
- NEXT (after 19:50 IST reset): spawn FRESH leads at effort "high" (resumed agents keep max effort and carry very large contexts), two at a time: first pages-lead + data-lead to finish their remaining Phase 1 items from the files on disk (checkpoint 159bc12), then motion-lead. Pending for pages-lead: remove all RERA mentions, legal name, both phones, WhatsApp button on. Poll usage every ~5 minutes; wrap up at ~90%, stop at 98%.
