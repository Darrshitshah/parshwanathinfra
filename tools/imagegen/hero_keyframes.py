"""Hero 'township builds itself' keyframes: strict edit of each Blender clay stage into a photoreal drone photo.
Usage: python tools/imagegen/hero_keyframes.py <stage 1-5> [suffix]   (one call per run; attaches ONLY the clay stage)
"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _lib import GEN, gen_image

CLAY = GEN / "hero-stages"

LEAD = (
    "IMAGE 1 is a grey clay-model render (Blender) of a township site seen from a fixed drone camera. TASK: STRICT EDIT. "
    "Turn IMAGE 1 into a photoreal drone photograph of the real construction site as it looks at one stage of its build, "
    "keeping the identical camera, framing, horizon, site outline, road lines, building footprints and building heights "
    "of IMAGE 1. The result must line up with IMAGE 1 when laid over it. Do not redesign, move, add or remove anything "
    "the stage description does not list. The site is in the flat Vapi to Silvassa plain, Gujarat, India. Light: warm "
    "golden morning sun, long soft shadows, thin haze at the horizon, a soft sky with a few light clouds, natural drone "
    "photograph colours, real textures, no CGI look. "
)
TAIL = (
    " Beyond the site edge, replace the flat beige ground of IMAGE 1 with real surroundings: patchwork farmland in green and "
    "dry ochre, hedgerows, mango and neem trees, a few distant farm huts, and a haze of trees at the horizon. "
    "No text, letters, numbers, logos, watermarks or brand names anywhere. Any cars are Indian-market models with unreadable "
    "plates. Do not crop, reframe or change the camera."
)

STAGES = {
    1: ("STAGE 1, bare site. The whole site is bare graded earth: smooth levelled reddish-brown and buff soil with tyre "
        "tracks, a few small mounds, no buildings, no roads, no equipment. The survey lines drawn in IMAGE 1 become orange "
        "marking paint lines and short wooden pegs with small orange flags on the soil, running exactly where IMAGE 1 shows "
        "them, including the circle of the roundabout. The Vapi-Silvassa Road along the right edge is a real worn grey "
        "asphalt highway with a few trucks and cars on it, exactly where IMAGE 1 draws its curved lines."),
    2: ("STAGE 2, roads laid. Exactly the road network of IMAGE 1 is now fresh dark-black asphalt with crisp white edge "
        "markings, neat granite kerbs along both sides, and the central roundabout island raised with a granite kerb and "
        "bare earth inside, in the same positions and widths as IMAGE 1. Every other part of the site, including the flat "
        "pale areas and the small raised strips of IMAGE 1, stays bare graded earth with no buildings. The highway on the right "
        "edge is the existing worn asphalt road with a few vehicles. Nothing else is added."),
    3: ("STAGE 3, plinths. Each grey block of IMAGE 1 is now only a low concrete plinth slab (a raised foundation platform "
        "about one storey tall at most) on exactly its clay footprint, pale grey concrete with visible shuttering lines, "
        "with starter bars poking up. The roads are fresh asphalt with granite kerbs as in IMAGE 1 (roundabout island "
        "included). Add only: a few site vehicles (two excavators, a concrete mixer truck, a dumper, a pickup), a few "
        "workers in orange and yellow safety vests and white helmets, candid, Indian, small in frame, and neat stacks of "
        "bricks, steel bars and sand beside the plinths. Rest of the ground is bare earth."),
    4: ("STAGE 4, frames rising. Every block of IMAGE 1 is now a raw reinforced-concrete frame (columns, beams, floor "
        "slabs, no walls yet for the upper storeys) rising to exactly the height of its clay block, with bamboo and steel "
        "scaffolding and green safety netting on the facades, and rebar sticking out from the top slabs. Lower floors of "
        "some blocks have brick infill started. The low row-house blocks are partly built in raw red brick, two storeys with "
        "open window gaps. Add only: one or two yellow tower cranes standing beside the tallest blocks, a few site vehicles, "
        "workers in safety vests, material stacks. Roads are fresh asphalt with granite kerbs as in IMAGE 1."),
    5: ("STAGE 5, completed township. Every block of IMAGE 1 is now a finished building at exactly its clay height and "
        "footprint: the tall blocks are six storeys plus a roof terrace, painted a warm khaki sand-olive, with white box-frame "
        "balcony surrounds, charcoal metal railings and neat windows; the low row houses are two storeys plus a terrace with "
        "white portal frames, red exposed-brick pillars and olive walls, flat roofs with thin white parapets. Roads are "
        "asphalt with granite kerbs, parking and paths in grey interlocking pavers, the roundabout island planted. Add "
        "only landscaping: green lawns in the open spaces of the site, planted courtyards, palms and flowering trees, "
        "hedges, a few parked Indian-market cars and a few tiny residents. No cranes, no scaffolding, no construction "
        "equipment."),
}

CAMERA_LOCK = (
    " CAMERA LOCK: the buildings must occupy exactly the same pixels as the grey blocks of IMAGE 1: the left end of the "
    "township sits at the same place near the left edge, the right-hand cluster ends at the same place near the right edge, "
    "the tall row of blocks keeps the same heights relative to the horizon, and the roundabout and road between the two "
    "halves stay in the same place. The horizon stays at the same height as in IMAGE 1. Do not move the camera lower or closer. "
    "Show the building frames at the full height of their clay blocks."
)

if __name__ == "__main__":
    n = int(sys.argv[1])
    suffix = sys.argv[2] if len(sys.argv) > 2 else ""
    prompt = LEAD + STAGES[n] + (CAMERA_LOCK if "lock" in suffix else "") + TAIL
    gen_image(f"hero-keyframes/stage-{n}{suffix}", prompt, inputs=[CLAY / f"stage-{n}.png"], aspect="16:9", size="4K",
              summary=f"hero keyframe stage {n}{suffix}: strict edit of clay stage into photoreal drone photo")
