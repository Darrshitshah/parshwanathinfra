# Parshwanath Infra website (flagship: Shiv Shiva Township)

This folder is its own project. The parent folder `~/CLAUDE the GOD/` is an unrelated, live crypto-trading workspace:
ignore its CLAUDE.md (excluded in `.claude/settings.json`), and never run, edit, restart or commit anything there.

## Read these
- `docs/BUILD_SPEC.md`: the full brief (stack, signature experiences, pages, budgets, taste notes).
- `docs/SOURCE_PACK.md`: every fact and file about Shiv Shiva, the layout-plan key, the row-house changes, alignment.
- `docs/SWARM_PROMPT.md`: how the Opus director, Sonnet leads and Haiku workers run the build. `docs/TEAM_RULES.md`: rules for all agents.
- `docs/PROGRESS.md`: where the build stands. Update it after every step.

## Rules that never bend
- Facts only from `docs/SOURCE_PACK.md`; unknown = visible "TBD" plus an entry in `docs/QUESTIONS.md`. Never invent numbers.
- No em dashes or en dashes anywhere (Darshit's rule). Use commas, colons, full stops, "·" or "→".
- Spelling: Parshwanath Infra, Shiv Shiva Township.
- No RERA mention anywhere for now (Darshit, 2026-10-10: Gujarat RERA registration later; revisit before public launch). Renders labelled "Artist's impression".
- Commit and push after every meaningful step (only the Director runs git). Never commit `_source/`, secrets or 24 MB originals.
- Paths contain spaces and this folder's name ends with a space: quote every path.
- Never open Darshit's contacts or bills folders; never publish the raw CAD sheet or its title block.
- Darshit decides through popups with concrete options and a recommended first option.
- Tests: logic (content, validation, API, utilities) aims for 80%+ coverage per Darshit's global rules; visual and motion work
  is verified with Playwright and browser checks at 360 px and 1440 px, with and without reduced motion.

## Tools
- PDF: `uv run --no-project --python 3.12 --with pymupdf python tools/pdf/plan_extract.py --pdf <pdf> --out _source/cad --tiles`
- Blender: `tools/.venv-blender/bin/python` with `bpy==5.2.2` (Python 3.13), see BUILD_SPEC section 3.
- Images: Nano Banana 2.1 on Vertex AI (project `my-jev-autonomous-agent`, ADC), approved for unrestricted use on this site;
  one request at a time, strict edits, words-only style. See BUILD_SPEC section 3.
- Dev server: `.claude/launch.json` ("parshwanath-dev", `npm run dev`, port 3000).

## Next.js version note
Next.js 16.4 (see `AGENTS.md`): read `node_modules/next/dist/docs/` before writing Next code. Ownership and contracts: `docs/OWNERSHIP.md`.
