# Build progress

Status: NOT STARTED (prepared 2026-10-10). When everything below is ticked and Darshit has the final preview, write
"BUILD COMPLETE" on the status line.

Each line: `- [x] item · commit <hash> · preview <url> · <date>`.

## Phase 0 · Director
- [ ] Kickoff popup answered, decisions logged
- [ ] Auto-resume task created (if chosen)
- [ ] Tools verified (node, npm, git, uv, PyMuPDF extract in _source/cad)
- [ ] git init on develop, remote added, first push
- [ ] Next.js scaffolded, all packages installed
- [ ] Contracts: schema.ts, device-tier.ts, motion/index.ts stubs, tokens.css, OWNERSHIP.md
- [ ] Vercel connected, first preview link

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
