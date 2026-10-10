# Decisions log

Every choice made without Darshit, and every answer he gives. Format: `date · decision · option taken · why`.

- 2026-10-10 · Project folder · use the existing `~/CLAUDE the GOD/Parshwanath portfolio ` folder (Darshit called it "Parshwanaath Infra") · it already held his first build prompt.
- 2026-10-10 · Brand spelling · "Parshwanath" · every real file (flyer, portfolio) uses it.
- 2026-10-10 · Blender · headless `bpy` 5.2.2 module via uv (Python 3.13) instead of Blender.app · no admin password or Homebrew needed.
- 2026-10-10 · PDF reader · PyMuPDF via uv, not poppler · Homebrew is not installed; PyMuPDF reads vectors, text positions and renders at any DPI.
- 2026-10-10 · Agent hierarchy · nested subagents (depth 2), not agent teams · agent teams cannot nest; Opus → Sonnet → Haiku needs nesting.
- 2026-10-10 · Kickoff Q1, GitHub repo · "Build locally now, connect GitHub later" (Darshit) · commits go to a local `develop` branch; no remote, no push, no Vercel until Darshit connects them.
- 2026-10-10 · Kickoff Q2, look · "A · Drafting table" (Darshit) · warm paper, ink linework, clay white, brick red accent; dark and light tokens.
- 2026-10-10 · Kickoff Q3, updated layout plan · "Not now: trace the row houses from the render and the photo, mark them indicative" (Darshit) · row-house district labelled "Indicative, as per the current layout plan".
- 2026-10-10 · Kickoff Q4, auto-resume · "Yes, check every hour and continue" (Darshit) · scheduled task `parshwanath-build-resume` at minute 7 of every hour.
- 2026-10-10 · Session folder · the Director session runs with its working directory on the parent folder, every command `cd`s into the project with a quoted absolute path · the session tool trims the trailing space in `Parshwanath portfolio `, so the session could not be moved into the folder.
- 2026-10-10 · Lead agents · general-purpose subagents on Sonnet with the body of `.claude/agents/<name>.md` pasted into the work order · the project's agent types only load in a session opened inside the folder (the documented fallback in the resume prompt).
- 2026-10-10 · Preview · local dev server (`npm run dev`, port 3000) instead of a Vercel preview until GitHub and Vercel are connected.
- 2026-10-10 · Next.js config · `cacheComponents` and `partialPrefetching` off (create-next-app 16.4 turns them on) · the site is fully static, and with them on Next keeps old routes mounted but hidden (React Activity), which fights GSAP pinning and the page curtain.
- 2026-10-10 · Fonts · Instrument Serif (display), Inter Tight (body), JetBrains Mono (annotations) · the spec's options; Instrument Serif is the serif Darshit already likes, Inter Tight keeps body text neutral against it.
- 2026-10-10 · Device tiers · phones reach Tier A only at 8 GB class memory and 8+ cores on 4G; phones that do not report memory (iOS Safari) get Tier B · keeps the WebGL diorama off the mid-range Android audience the spec names as Tier B.
- 2026-10-10 · Images · `next/image` derives widths and AVIF/WebP from one compressed master per image (max 2560 w) · one pipeline, no duplicate variants in git.
- 2026-10-10 · Dependencies · `@types/node` 24 (matches Node 24 here and Vitest 5's peer range) · the scaffold's `@types/node` 20 conflicted with Vitest 5.
- 2026-10-10 · Usage pacing (Darshit) · Director checks the plan usage (5-hour window) about every 10 minutes, estimates the burn rate, sends leads "WRAP UP" near 85% and stops them by 95% so 5% always stays in reserve; work is checkpoint-committed before resuming · three max-effort leads exhausted the 5-hour window three times mid-step.
- 2026-10-10 · Legal name (Darshit) · "Parshwanath Infra Pvt. Ltd." · confirmed in popup.
- 2026-10-10 · Phones (Darshit) · show 78743 05000 and 78743 06000 as sales numbers; 78743 05000 is WhatsApp (floating button on).
- 2026-10-10 · Price (Darshit) · "Price on request".
- 2026-10-10 · RERA (Darshit) · do not mention RERA anywhere on the site yet; Shiv Shiva will register under Gujarat RERA later. This overrides BUILD_SPEC non-negotiable 4. Director flagged that RERA Section 3 restricts advertising an unregistered project: fine for a private preview, must be revisited before public launch.
- 2026-10-10 · Pacing (Darshit) · "2 leads, effort high": at most two Sonnet leads at a time at effort high (not max), Haiku workers for mechanical work; stop at 98% of the 5-hour window (Darshit raised the stop line from 95%).
