# Motion references and workflows

Collected for the Shiv Shiva hero and launch film. Ideas only; never copy footage, text or audio.

## 1. "Build the tower" reel (pires.visuals, Instagram, 2026-09)
An AI shot: empty plot, building fragments fly in and assemble into the finished tower. Made with a reference image
plus a structured animation prompt so the architecture stays exact. Our version: "Shiv Shiva builds itself"
(Blender-first pipeline, see DECISIONS 2026-10-11).

## 2. heytabi.app launch film (Nikhil Bhima on X, 2026-10-10)
"opus 5.5 one-shotted this launch film". Tools, as listed by the author:
1. Claude Code (Opus 5.5, max effort): script, direction, the whole build.
2. Blender: the 3D hero object (a keyboard).
3. Remotion: motion graphics and editing (React components rendered to video, timeline in code).
4. Mistral Voxtral: three voices and translations.
5. ElevenLabs: music and 18 sound effects.

What it teaches us: one agent writes the script and the edit as code; 3D comes from Blender; the film is assembled
programmatically (cuts, typography, transitions timed to music) instead of in an editor; sound design is part of it.

## How we adapt it (proposal, needs Darshit's approval before installing anything)
- **Film assembly in code:** Remotion (React, same stack as the site) composes a 30 to 45 s Shiv Shiva film: the
  plan drawing itself (our SVG and the boundary), Blender construction stages, the Veo/Omni "builds itself"
  segments, the orbit and the row-house dusk clip, mono CAD annotations and the confirmed counts as dimension lines,
  ending on the wordmark and the enquiry line. Rendered to MP4 (16:9 hero cut, 9:16 Instagram/WhatsApp cut later).
  Lives in `tools/film/` (not in the site bundle). Licence check: Remotion is free for individuals and companies
  with up to 3 employees; a larger company needs a Remotion company licence. Ask Darshit.
- **Sound (film only; the website video stays muted):** use Darshit's Google billing where possible:
  Lyria (`lyria-3-pro-preview` / `lyria-002`, in the Vertex catalogue) for music, Google TTS / Gemini voices for an
  optional voice-over in English, Hindi and Gujarati. Voxtral and ElevenLabs would need new accounts and keys
  from Darshit.
- **Website hero:** the site keeps a short, muted, compressed loop of the "builds itself" shot with a poster frame
  (budgets in BUILD_SPEC section 11); the full film with sound is for social and the project page.
