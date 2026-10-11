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
- [x] CAD layer map and transform.json (residuals logged) · commit d54f3a1 · 2026-10-10
- [x] plan.json (sectors 01 to 05, roads, row-house district, plots 1 to 165, amenities) · commit d54f3a1 · 2026-10-10
- [x] Web plan SVG and chapters.ts · commit d54f3a1 · 2026-10-10
- [x] Unit plan SVGs · commit d54f3a1 · 2026-10-10
- [x] Content files with facts and TBDs · commit d54f3a1 · 2026-10-10
- [x] Image pipeline and deep-zoom tiles · commit d54f3a1 · 2026-10-10
- [x] Motion setup, primitives, transitions · commit 8432ce4 · 2026-10-10
- [x] S1 loader, S8 cursor · commit 8432ce4 · 2026-10-10
- [x] Layout shell, nav, footer, enquiry drawer UI · commit b7f264b · 2026-10-10
- [x] All pages as static sections · commit b7f264b · 2026-10-10

## Phase 2 · plan-lead, scene-lead, pages-lead, motion-lead
- [x] S3 Living Plan · built 613d1d4, mounted 0d7d0f9 · 2026-10-11
- [x] S5 Building explorer · built 613d1d4, mounted 0d7d0f9 · 2026-10-11
- [ ] Blender module installed, scene built, stills, sequence, GLB
- [ ] S4 Diorama (WebGL, sequence, still)
- [ ] Generated images (cloud plates, dusk pair, icons, OG)
- [ ] S2 sky descent mounted and choreographed
- [ ] S6 row-house street
- [ ] Enquiry API, SEO, legal pages, 404 (API route, legal pages, 404 done in b7f264b; SEO extras pending)

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
- 2026-10-10 16:00-16:25 IST · Fresh leads at effort high: pages-lead done (b7f264b), motion-lead done (8432ce4), layout passes the township shape to MotionRoot. data-lead finishing plan data; scene-lead started Phase 2a (Nano Banana stills + Veo 3.1 clips). Burn about 2% per minute with two leads.
- 2026-10-10 16:55 IST · plan-lead done (613d1d4): S3 Living Plan + S5 explorer built, not yet mounted (pages-lead next). scene-lead making 4K Veo clips (rowhouses-A done). Usage 81%.
- 2026-10-10 17:10 IST · Window closed at ~87%. Veo 3.1 4K clips made: rowhouses-A, rowhouses-B, dive-A (previews sent to Darshit; originals in _source/generated/video/). NEXT WINDOW (after ~01:30 IST): (1) scene-lead: dive-B, orbit-A, orbit-B with OPTIMIZED 4K inline; (2) pages-lead: mount LivingPlanSlot (home story + project explore), ExplorerSlot, BoundaryLoader on Home, then the clips Darshit picks; (3) then scene-lead Blender diorama, motion-lead S2/S6 choreography, SEO; then Phase 3 QA.
- QA follow-up: Home OG PNG is 638 KB; WhatsApp may skip previews over ~300 KB (main channel in India): reduce in Phase 3.
- 2026-10-11 ~16:00 IST · Window at 86%. Done this window: pages mounted Living Plan + explorer + loader (0d7d0f9), SEO (4eacc87), diorama S4 built (2782e2d, not yet mounted), Omni study + A/B decision (cc50481). Hero = Blender-first "township builds itself" (see DECISIONS).
- NEXT WINDOW: (1) diorama-lead: hero_camera.py + render_stages.py (5 construction stages from the SS-01 camera); (2) pages-lead: mount DioramaSlot on Home (client wrapper, onBuildingSelect → explorer deep link); (3) scene-lead: Nano Banana photoreal keyframes from the clay stages → Darshit approval → Veo + Omni A/B stage-to-stage segments; (4) motion-lead: S2 hero mount of the build shot + S6 row-house clip; then Phase 3 QA. Open questions: shops block A height (6 floors indicative), entry piers, tip building clubhouse/temple.
