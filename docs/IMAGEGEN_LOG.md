# Image and video generation log

Every call to Nano Banana 2.1 (`gemini-nano-banana-2.1`, location `global`) and Veo 3.1 (`veo-3.1-generate-001`, `us-central1`) for this site, newest last. Originals and prompts live in `_source/generated/` (gitignored). Times are local.

| Time | Model | Inputs | Prompt summary | Output | Result |
|---|---|---|---|---|---|
| 2026-10-10 20:48 | gemini-nano-banana-2.1 | none (text only) | sky plate sky-dive-first-frame | - | failure: Cannot send a request, as the client has been closed. |
| 2026-10-10 20:48 | gemini-nano-banana-2.1 | none (text only) | sky plate sky-dive-first-frame | _source/generated/sky-dive-first-frame.png | success |
| 2026-10-10 20:49 | gemini-nano-banana-2.1 | none (text only) | sky plate sky-clouds-high | _source/generated/sky-clouds-high.png | success |
| 2026-10-10 20:50 | gemini-nano-banana-2.1 | none (text only) | sky plate sky-clouds-mid | _source/generated/sky-clouds-mid.png | success |
| 2026-10-10 20:50 | gemini-nano-banana-2.1 | none (text only) | sky plate sky-clouds-low | _source/generated/sky-clouds-low.png | success |
| 2026-10-10 20:52 | gemini-nano-banana-2.1 | SS-26 Row Houses by Day - hiranandani.png | SS-26 same-camera dusk edit (blue hour, warm windows), strict edit | _source/generated/ss26-row-houses-dusk.png | success |
| 2026-10-10 20:53 | gemini-nano-banana-2.1 | SS-26 Row Houses by Day - hiranandani.png | SS-26 same-camera dusk edit (blue hour, warm windows), strict edit | _source/generated/ss26-row-houses-dusk.png | success |
| 2026-10-10 20:53 | (local crop, no model call) | SS-01, SS-33, SS-26 v2 + generated plates | prepared 16:9 keyframes | _source/generated/keyframes/*.png | success |

Notes: row 1 (client closed) was a local script bug before any request reached the API, so it was not billed. The first dusk SS-26 output (`ss26-row-houses-dusk-rejected1.png`) was REJECTED: it added a pitched tiled roof and grey walls, dropped brick pillars (architecture changed). The retry with a fixed-architecture block was accepted. No Veo call has been made.
