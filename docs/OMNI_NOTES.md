# Gemini Omni 1.1 Flash: what it is and how to use it with Veo 3.1

Studied 2026-10-11 (model `gemini-omni-1.1-flash-preview`, PUBLIC_PREVIEW, location `global`, released 2026-08-27). Evidence: the Vertex model page and video guides, plus probes logged in `docs/IMAGEGEN_LOG.md`. Probe code: `tools/imagegen/omni.py`.

## What it is

Not a text/image model with video as an extra. Google describes it as a "multimodal model for fast, conversational video generation, editing and cinematic control". It is a second video generator, a sibling of Veo, that also understands images and text and "thinks" before it renders.

## Facts from the model page

| | |
|---|---|
| API | **Interactions API only** (REST `v1beta1/.../locations/global/interactions`). `generateContent` is refused for both Omni ids. |
| Input | text, images (up to 10, 20 MB each inline), video (up to 3 clips, 10 s each) |
| Output | text and **video (with generated sound)**. Image output and audio-only output are not supported. |
| Video | 16:9 and 9:16, 360p/720p/1080p/4k, 3 to 10 s, default 720p |
| Tasks | text-to-video, image-to-video, first+last frames, references (images or videos), edit a video, extend a video (up to 40 s total), C2PA content credentials |
| Not supported | system instructions, structured output, caching, grounding, tools, batch, pay-as-you-go (fixed quota only) |
| Tokens | in 131,072, out 57,920 (the 4k 8 s clip reported 139,008 output tokens, so that cap is about the text side) |

## What our probes showed

| Probe | Result |
|---|---|
| generateContent text | FAIL 400 "only supported in the Interactions API" (both ids) |
| Interactions text in/out | OK, 5 s. Says it can output text, image, video, audio; the platform says otherwise (see below) |
| image in, no response_format | It does **not** answer in text: it renders a video from the image (57,920 output tokens, 46 s) |
| image in, `response_format: text` | OK, 11 s, accurate description (two-storey olive and red brick row houses, symmetric). Usable as a "look at the image" step |
| video in, prompt asking for analysis (also with `response_format: text`) | It ignored the text format and **extended our 8 s Veo clip** into an 18 s 720p clip with audio (132 s). Not usable as a video reviewer |
| image out (`image`, `text`+`image`) | FAIL 400 "Modality image is not enabled for this model" |
| audio out | FAIL 400 "Modality audio is not enabled" |
| first+last frames, 4k, 8 s, our SS-26 day and dusk keyframes, our Veo prompt | OK, 197 s, true 3840x2160, 24 fps, 28 Mbps H.264, 29 MB. Day to blue hour, windows lighting up, same buildings, floors and windows. Quality is on par with Veo rowhouses-A. It adds audio even when told "no audio" (strip with `ffmpeg -an`) |

Behaviours to remember: input media decides the task (image in means image-to-video, video in means extend), so always set `response_format` and `generation_config.video_config.task` explicitly. The first-frame/last-frame order is conveyed by image order plus the prompt; there is no negative-prompt field, so put "Avoid: ..." into the prompt. People in the 4k clip walk as in Veo's; no invented buildings.

## Ways to combine Omni 1.1 Flash with Veo 3.1

1. **Two engines, same keyframes, pick the best take (A/B).** Run every hero clip once on Veo and once on Omni from identical first/last frames and prompt, frame-check both, keep the better. Omni is a different model with different failure modes, so the chance that at least one take is clean rises without re-rolling the same engine. Cost: one extra ~3 min render per clip.
2. **Omni as repairer and extender of a good Veo take.** Feed a Veo clip into Omni with task `edit` (for example "remove the extra walkers in the last second, change nothing else") or `extend` (hold on the dusk frame, loop-friendly tail, up to 40 s total). Useful when a take is 90 percent right. Risk: edit drifts the whole clip, so frame-check the result.
3. **Omni as a text director.** `response_format: text` with the keyframe image gives a good shot description in about 10 s, which can seed or refine a Veo prompt. Low value here because our Veo prompts are already hand-tuned and keyframes are fixed; and Omni cannot review video in text (see probe), so a separate text model (a Gemini Flash/Pro via generateContent) would be needed for automated frame review.
4. Not available: Omni cannot generate keyframes (no image output). Keyframes stay with Nano Banana 2.1.

## Recommendation

**Option 1 plus the repair role of Option 2.** Treat Omni as a second video engine (we have quota and it matches Veo's fidelity at 4k), A/B every clip, and use Omni `edit` only to fix a single flaw in an otherwise good take. Skip Omni as director. Also note Omni supports 9:16, which would give phone-native versions of the clips without cropping.

## Risks

- Preview model: behaviour and limits can change; fixed quota, no pay-as-you-go.
- Output always carries audio (strip before web use with `-an`); the model page says it also supports C2PA content credentials, not yet checked in our file.
- Latency 3 to 3.5 min per 8 s 4k clip; edit and extend can silently re-render the whole clip.
