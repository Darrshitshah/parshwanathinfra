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

SIX4 = (
    " HEIGHT LIMIT (very important): no concrete frame is taller than six levels (ground plus five), each storey about 3 m, "
    "so the highest frame tops out at about 18 m, roughly one third of its own length. Count the floor slabs: the tallest "
    "frames show exactly six slabs and six rows of column bays, never more; most other blocks show three to five slabs "
    "with the upper floors still open frames; the row houses are two storeys. Even the tallest frame looks only about as tall as "
    "two thirds of a tower crane mast. Keep the floors easy to count: bare concrete columns, beams and slabs with open bays, "
    "scaffolding only as thin bamboo poles along a few bays and green netting only as short strips on the top level, never "
    "covering a whole facade. Keep the same footprints and camera."
)
SIX5 = (
    " FLOORS (the most important instruction): every apartment block is six storeys of apartments, ground plus five, with a "
    "roof terrace on top. Each storey is about 3 m, so a block is about 19 m to its parapet and its height is roughly one "
    "third of its length. On every long facade there are SIX clearly countable rows of windows and balconies (Ground, 1st, 2nd, "
    "3rd, 4th, 5th), above square stilt columns and covered parking at the very bottom. The windows are small and numerous: "
    "narrow vertical white box-frames, each wrapping a tall stack of exactly SIX windows one above the other (six small "
    "balcony windows tall, two windows wide; count them: 1, 2, 3, 4, 5, 6) with thin charcoal horizontal balcony "
    "railings, repeated every 4 to 5 m along the facade (so a long block shows many frames side by side), walls in warm khaki "
    "sand-olive. On every roof there is a terrace with a low white parapet and several small square stair and lift headroom "
    "blocks. The row houses are two storeys plus a roof terrace with a parapet, white portal frames, red exposed-brick pillars "
    "and olive walls. Make the buildings read as tall mid-rise blocks, clearly taller than the trees, at the same footprints "
    "and camera as the clay. Look: like the premium architectural render of the project at golden hour, lush dense greenery "
    "(tree canopies, flowering trees, palms, deep green lawns and courtyards), grey interlocking pavers, soft warm light."
)
EDIT5 = (
    "IMAGE 1 is a drone photograph of a completed township. TASK: STRICT EDIT. The apartment blocks currently show only about "
    "four to five rows of windows above the ground-floor stilts. Make every apartment block 25 percent taller: each white window frame that now wraps a stack of four or five windows "
    "must wrap a stack of SIX windows, and the walls grow upward accordingly, so the blocks become about 19 m tall and "
    "clearly taller than the palms and trees beside them, with a longer shadow. Raise every apartment block to exactly six "
    "storeys (ground plus five) plus a roof terrace, keeping every footprint, the camera, the framing, the roads, the roundabout "
    "and the layout exactly as in IMAGE 1. Each storey is about 3 m, the blocks become about 19 m to the parapet, so six rows of "
    "windows and balconies are clearly countable on each facade (Ground, 1st, 2nd, 3rd, 4th, 5th), with white box frames around "
    "window stacks, charcoal horizontal railings, square stilt columns at ground, a roof terrace with a low parapet and small "
    "stair and lift headroom blocks. Row houses stay two storeys plus a terrace. Keep the khaki sand-olive paint. The "
    "surroundings, light and greenery stay as in IMAGE 1, with a little more lush greenery between the buildings. No text, "
    "logos or brand names. Do not crop, reframe or change the camera."
)

TRIM4 = (
    "IMAGE 1 is a drone photograph of a building site with reinforced-concrete frames rising. TASK: STRICT LOCAL EDIT. The "
    "tallest concrete frames (the two tall frames on the left and the tall frame near the middle) are too tall: cut each of them "
    "down so it has exactly six levels (ground plus five), six floor slabs and six rows of column bays, about 18 m, each storey "
    "about 3 m, with the top slab at a similar height to the lower frames next to it plus two or three storeys. Keep their "
    "footprints and positions. Keep EVERYTHING else exactly as in IMAGE 1: the camera, framing, horizon, roads, the other "
    "buildings, cranes (the cranes stay as tall as they are), vehicles, workers, material stacks, light and surroundings. No "
    "text, logos or brand names. Do not crop, reframe or change the camera."
)

TRIM4B = (
    "IMAGE 1 is a drone photograph of a building site with reinforced-concrete frames rising. TASK: STRICT LOCAL EDIT. The "
    "two tall frames at the upper left (next to each other, under green netting) and the tall frame just right of them are "
    "still too tall. Lower each of these three frames so that it is exactly six levels tall (ground plus five): six clearly "
    "countable floor slabs, six rows of column bays, about 18 m, only slightly taller than the long concrete block in front of "
    "them and no taller than the frame at the right edge of the site. Make the floors easy to count: green netting and bamboo "
    "scaffolding cover only the top two levels, the lower four levels show bare concrete columns, slabs and brick infill. "
    "Keep their footprints and positions. Keep EVERYTHING else exactly as in IMAGE 1: the camera, framing, horizon, roads, the "
    "other buildings, cranes, vehicles, workers, material stacks, light and surroundings. No text, logos or brand names. Do "
    "not crop, reframe or change the camera."
)

FL5 = (
    " FLOORS (follow IMAGE 1 exactly): every apartment block in IMAGE 1 is built as an open stilt-parking ground storey on square "
    "stilt columns, plus FIVE floors of windows above it (five clearly countable window rows, 1st to 5th floor), then a roof "
    "terrace with a low parapet and small stair and lift headroom blocks. The recessed window bays, slab bands and headroom "
    "blocks drawn in IMAGE 1 become real windows with white box-frames, charcoal horizontal balcony railings and parapets, in "
    "the same positions. Do not add or remove a floor. The stilt level has parked Indian-market cars between the columns. "
    "Walls are warm khaki sand-olive paint. The row houses are two storeys plus a roof terrace with white portal frames, red "
    "exposed-brick pillars and olive walls. Look: like the premium architectural render of the project at golden hour, lush "
    "dense greenery (tree canopies, flowering trees, palms, deep green lawns and courtyards), grey interlocking pavers, soft "
    "warm light. Keep the same camera, horizon, footprints and heights as IMAGE 1."
)
FL4 = (
    " FLOORS (follow IMAGE 1 exactly): the frames in IMAGE 1 are at stilt ground storey plus up to five floors; build exactly "
    "the levels IMAGE 1 shows, each block rising as raw reinforced-concrete columns, beams and slabs (open stilt ground "
    "storey, then slabs above), no block taller than IMAGE 1 shows (never more than six levels in total). Keep the floors "
    "easy to count: bare concrete, scaffolding only as thin bamboo poles along a few bays and green netting only as short "
    "strips on the top level. Brick infill only on some lower floors. Keep the same camera and footprints as IMAGE 1."
)

if __name__ == "__main__":
    n = int(sys.argv[1])
    suffix = sys.argv[2] if len(sys.argv) > 2 else ""
    CL = CAMERA_LOCK.replace(" Show the building frames at the full height of their clay blocks.", "")
    prompt = LEAD + STAGES[n] + (CAMERA_LOCK if "lock" in suffix or "six" in suffix else "") + TAIL
    src = CLAY / f"stage-{n}.png"
    if n == 4 and "six" in suffix:
        prompt = LEAD + STAGES[4] + SIX4 + CL + TAIL
    if n == 5 and "six" in suffix:
        prompt = LEAD + STAGES[5] + SIX5 + CL + TAIL
    if n == 5 and "fl" in suffix:
        src = CLAY / ("stage-5-floors-warm.png" if "flw" in suffix else "stage-5-floors.png")
        prompt = LEAD + STAGES[5].split(" Add ")[0] + " Add only landscaping" + FL5 + TAIL.replace("Beyond the site edge", "Beyond the site edge")
    if n == 4 and "fl" in suffix:
        src = CLAY / "stage-4-floors.png"
        prompt = LEAD + STAGES[4] + FL4 + TAIL
    if n == 4 and "trim" in suffix:
        src = GEN / "hero-keyframes" / "stage-4-v2.png"
        prompt = TRIM4
        if "trim2" in suffix:
            src = GEN / "hero-keyframes" / "stage-4-trim1.png"
            prompt = TRIM4B
    if n == 5 and "edit" in suffix:
        src = GEN / "hero-keyframes" / "stage-5-six3.png"
        prompt = EDIT5
    gen_image(f"hero-keyframes/stage-{n}{suffix}", prompt, inputs=[src], aspect="16:9", size="4K",
              summary=f"hero keyframe stage {n}{suffix}: strict edit of clay stage into photoreal drone photo")
