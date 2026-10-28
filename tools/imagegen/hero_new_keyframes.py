"""New-hero keyframes (lead A, opening half): strict Nano Banana edits of the stage-3 photo into earlier build stages, same camera and
surroundings, so the whole opening is one locked shot that joins stage-3 and stage-4-aligned.

  GOOGLE_CLOUD_PROJECT=my-jev-autonomous-agent ~/.local/bin/uv run --no-project --python 3.12 --with google-genai --with pillow \
    --with imageio-ffmpeg python tools/imagegen/hero_new_keyframes.py <key> [suffix]
Outputs _source/generated/hero-keyframes/new/<key><suffix>.png (+ .prompt.txt); every call is logged in docs/IMAGEGEN_LOG.md.
"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _lib import GEN, gen_image

KF = GEN / "hero-keyframes"
HEAD = ("IMAGE 1 is a drone photograph of a township construction site in the flat Gujarat plain at golden hour. TASK: STRICT LOCAL EDIT of "
        "the building site only. Everything outside the site stays pixel-for-pixel identical to IMAGE 1: the farmland, hedgerows, trees, "
        "farm huts, the dirt yard with its parked trucks, brick stacks and sand heaps in the lower left, the road on the right and the curved "
        "road along the front of the site, the horizon, the sky, the haze, the light and its shadow directions. Same camera, same framing, "
        "same horizon height: the result must line up with IMAGE 1 when laid over it. ")
TAIL = (" The earth, light and colour grade match IMAGE 1: warm golden morning sun, long soft shadows, natural drone photograph, real "
        "textures, no CGI look. No text, letters, numbers, logos or watermarks. Do not crop, reframe, zoom or change the camera.")
PROMPTS = {
    "bare": HEAD + ("Inside the site, remove every building, plinth, concrete slab, excavator, truck, worker and heap of material, and also remove "
                    "the asphalt internal roads and the roundabout. The whole site becomes one expanse of bare, levelled, compacted earth in the "
                    "same warm tan and ochre as the dirt yard of IMAGE 1, with grader and tyre tracks, a few small soil mounds, and a faint "
                    "survey layout: thin orange spray-paint lines and short wooden pegs with small orange flags on the soil, marking where a "
                    "spine road, a roundabout circle and plots will go. No buildings, no machines, no people anywhere inside the site.") + TAIL,
    "roads": HEAD + ("Inside the site, remove every building, plinth and concrete slab, but keep the internal asphalt roads and the roundabout "
                     "exactly as in IMAGE 1: fresh dark asphalt, granite kerbs, the same positions and widths. Where each building plinth was, "
                     "there is now only bare levelled earth carrying thin white lime lines that mark the footprint of the future block (long "
                     "rectangles and L-shapes in exactly the plinths' positions), and on a few of them a shallow excavated trench or pit with "
                     "a neat spoil heap beside it. Keep the two excavators and the concrete mixer truck of IMAGE 1 where they are. No concrete "
                     "slabs, no walls, no frames, nothing taller than the machines. A couple of workers in white helmets and orange vests may "
                     "stand near the trenches, tiny in frame.") + TAIL,
}
# keys that edit an earlier new keyframe instead of stage-3: key -> (source file, prompt)
FIXES = {
    "bare_fix": (KF / "new" / "bare1.png",
                 "IMAGE 1 is a drone photograph of bare levelled earth being prepared for a township. TASK: STRICT LOCAL EDIT. In the lower right "
                 "of the site, beside the stack of red bricks and the steel bars, there is still one white concrete slab with raised edges "
                 "(a foundation plinth): remove it completely and fill its place with the same bare tan levelled earth, with tyre tracks, "
                 "blending into the ground around it. Leave EVERYTHING else exactly as in IMAGE 1, pixel for pixel: the camera, the "
                 "framing, the horizon, all surroundings, the bricks, steel bars, pickup truck, sand heaps, the curved road at the right, "
                 "the survey lines, the light. No text. Do not crop, reframe or change the camera."),
    # mid frame between stage-3 (plinths) and stage-4-aligned (frames at most 6 levels): every block cut down to three levels
    "mid": (KF / "aligned" / "stage-4-aligned.png",
            "IMAGE 1 is a drone photograph of a low-rise housing township under construction. TASK: STRICT LOCAL EDIT of the buildings only. "
            "Show the same site about a month earlier: every apartment block is only HALF built. Each block keeps exactly its footprint and "
            "position, but is cut down to exactly three levels: an open stilt ground storey plus two floors of bare grey reinforced-concrete "
            "columns, beams and floor slabs, open bays with no walls, a few rebar stubs sticking up from the top slab, and no green netting. "
            "The blocks that now show five or six levels (the tall ones on the left and in the middle) become three levels, the same height as "
            "the low blocks beside them. Remove both yellow tower cranes and all scaffolding and netting. The low red-brick row houses at the "
            "back stay at ground level plus a first-floor slab, in raw red brick. Keep the plinth-level blocks that are already low as they are. "
            "Everything outside the buildings stays pixel-for-pixel identical to IMAGE 1: farmland, trees, the dirt yard, trucks, brick stacks, "
            "roads, roundabout, the horizon, the sky and the light. Nothing taller than three levels anywhere, no new buildings. Same camera and "
            "framing, no text, do not crop, reframe or change the camera."),
    # mid2: the downward edit (mid) barely changed the blocks, so edit UP from the stage-3 plinths instead
    "mid2": (KF / "frames-4k" / "stage-3.jpg",
             "IMAGE 1 is a drone photograph of a township construction site where every building is still only a low white concrete "
             "plinth slab. TASK: STRICT LOCAL EDIT of the buildings only. Show the same site about three weeks later: on every plinth the first "
             "two levels of the building have been built, as a bare grey reinforced-concrete frame exactly on the plinth's footprint: an "
             "open ground storey of square columns and a first floor slab on top of it, so each block is only TWO levels tall (about 6 m), "
             "low and long, with a few rebar stubs sticking up from the top slab. No walls, no brick infill, no scaffolding, no netting, "
             "no cranes. The long low blocks at the back left show only the ground-level columns. Nothing is taller than two levels "
             "anywhere. Everything outside the buildings stays pixel-for-pixel identical to IMAGE 1: the roads, roundabout, trucks, "
             "excavators, workers, brick stacks, sand, the dirt yard, farmland, trees, horizon, sky and light. No new buildings. Same "
             "camera and framing, no text, do not crop, reframe or change the camera."),
    # mid3: the km-mid footprints differ from stage-4-aligned, so Veo/Omni swapped layouts in seg14 (a cut at 4.9 s / shrinking blocks).
    # Take the layout of stage-4-aligned (IMAGE 1) and the build state of km-mid (IMAGE 2).
    "mid3": ([KF / "aligned" / "stage-4-aligned.png", KF / "new" / "km-mid.jpg"],
             "IMAGE 1 and IMAGE 2 are drone photographs of the same township construction site from the same camera. IMAGE 1 is the site "
             "about a month later with its final building layout; IMAGE 2 is the site earlier, when every building was only two levels high. "
             "TASK: produce IMAGE 1's site at the earlier stage of IMAGE 2. Keep EXACTLY the building layout of IMAGE 1: every block, wing and "
             "row house at its position, footprint and outline in IMAGE 1, with nothing added, removed or moved. But build state and height "
             "come from IMAGE 2: every block is only two levels tall (open ground storey of columns plus one floor slab, grey concrete, open "
             "bays, rebar stubs on top), the same height as the low blocks of IMAGE 2. The blocks that are five or six levels in IMAGE 1 are "
             "cut down to two levels. No cranes, no scaffolding, no green netting, no brick infill except the raw red-brick low row houses at "
             "the back left, which stay at one storey. Everything outside the buildings (farmland, trees, the dirt yard, trucks, brick stacks, "
             "roads, roundabout, horizon, sky, light) stays as in IMAGE 1. Nothing taller than two levels anywhere. Same camera and framing, "
             "no text, do not crop, reframe or change the camera."),
}
if __name__ == "__main__":
    key = sys.argv[1]
    suffix = sys.argv[2] if len(sys.argv) > 2 else ""
    src, prompt = FIXES.get(key, (KF / "frames-4k" / "stage-3.jpg", PROMPTS.get(key)))
    gen_image(f"hero-keyframes/new/{key}{suffix}", prompt, inputs=src if isinstance(src, list) else [src], aspect="16:9", size="4K",
              summary=f"new hero keyframe {key}{suffix} (hero lead A): strict local edit of stage-3 into an earlier build stage, same camera")
