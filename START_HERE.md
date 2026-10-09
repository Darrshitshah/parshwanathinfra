# Start here · Parshwanath Infra website

Prepared 2026-10-10 while you slept. Nothing has been built or deployed yet; this folder holds a ready-to-run, one-shot setup.
Edit anything you like before you start it.

## What is in this folder

| File | What it is | Edit it? |
|---|---|---|
| `docs/SWARM_PROMPT.md` | **The prompt you paste** into a new Claude Code session (Opus directs, Sonnet leads, Haiku workers), plus the auto-resume prompt | Yes, if you want a different team or order |
| `docs/BUILD_SPEC.md` | The full one-shot brief: your original prompt, rewritten and extended (signature interactions, Blender diorama, Nano Banana images, budgets, your taste notes) | Yes, this is the one to change after you wake up |
| `docs/SOURCE_PACK.md` | Every Shiv Shiva fact and file path, how to read the layout plan, **what changed in the row-house district**, how to line the plan up with the render | Correct any fact that is wrong |
| `docs/QUESTIONS.md` | Everything still TBD (RERA, prices, floors, contacts …). Answer what you can; the site shows TBD for the rest | Yes |
| `docs/TEAM_RULES.md`, `.claude/agents/*.md` | Rules and roles for the 6 Sonnet leads and 2 Haiku workers | Rarely |
| `.claude/settings.json` | Lets agents nest 2 levels (Opus → Sonnet → Haiku) and hides the trading-bot CLAUDE.md from the parent folder | No |
| `tools/pdf/plan_extract.py` | The PDF reader: pulls every label, dimension and vector layer out of the layout plan at full quality (tested) | No |
| `_source/cad/` | Its output, already generated: labels, dimensions, 300 dpi sheet, 600 dpi tiles (not committed to git) | No |
| `build-prompt.md` | Your original prompt, untouched | Keep for reference |

## How to start the build

1. Claude desktop app → new **Code** session in this folder.
2. Model **Opus 5.5**, effort **Max**, permission mode **Auto**.
3. Open `docs/SWARM_PROMPT.md`, copy the first box (starts with `ultrathink`), paste, send.
4. Answer the first popup (repo, look, updated layout plan, auto-resume). After that it can run unattended.

If the usage limit runs out mid-build and you chose auto-resume, an hourly task picks it back up after the reset. It only runs
while the Claude app is open and the Mac is awake (the Director asks for keep-awake). To resume by hand, paste the second box
from `docs/SWARM_PROMPT.md`.

Effort: the Sonnet leads and Haiku workers are set to `effort: max` ("ultra"). If Claude Code says a level is not available for
Haiku, change `effort: max` to `effort: high` in `.claude/agents/haiku-worker.md` and `haiku-scout.md`.

## Things to know

- The folder's real name is `Parshwanath portfolio ` (it ends with a space). Everything handles that, but if you rename it to
  `Parshwanath Infra`, also update the folder path in the resume prompt inside `docs/SWARM_PROMPT.md`.
- Blender runs headless as a Python package (`bpy` 5.2.2), so no app install or password is needed. Install Blender.app from
  blender.org only if you want to open the 3D scene yourself.
- Nano Banana 2.1 is written into the brief as approved for unrestricted use on this site, with the lessons from the v2 renders
  (one request at a time, strict edits, describe the style in words).
- Your portfolio repo is not touched; the build only reads from it.
- The 2022 layout plan PDF stops where the row houses begin. If you have the newer plan as a PDF or DWG, drop it into `_source/`
  before starting; it makes the row-house district exact instead of traced.
