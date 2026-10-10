"""Step 2: same-camera dusk version of SS-26 (row houses by day). Usage: python tools/imagegen/dusk.py [suffix]"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _lib import STRICT, DO_NOT, V2, gen_image

SRC = V2 / "SS-26 Row Houses by Day - hiranandani.png"
PROMPT = (
    "IMAGE 1 is a photoreal straight-on elevation of the row houses of Shiv Shiva Township, Gujarat, India, by day. "
    + STRICT + " "
    "SS-26 specifics: copy the elevation of every unit exactly: same number of units, each two storeys with a flat roof; the "
    "deep white portal frame around one unit and the recessed open balcony bay of the next, alternating in the same order; "
    "the red exposed-brick pillar in the same place on each pair; the same window sizes and positions; planter boxes with "
    "creepers under the upper windows; car porches with the same cars on the ground floor; palms in the same positions; "
    "the same paved lane and lawn edges. "
    "FIXED ARCHITECTURE, copy exactly from IMAGE 1: every roof is FLAT with a thin white parapet and no pitched or tiled roof "
    "anywhere; the wall colour stays warm olive-khaki and mustard, not grey; on each pair of units a tall red exposed-brick "
    "pillar rises from the top parapet down past the upper windows, exactly where IMAGE 1 has it; each upper window pair "
    "sits under the same flat roof with a planter box of trailing creepers beneath it; the white portal frames and the "
    "recessed balcony bays alternate along the street in the same left-to-right order as IMAGE 1; the ground floor has the "
    "same open car porches with the same cars and the same two or three people. The two palms and the left and right "
    "edge plants stay in the same positions. Only the lighting, sky colour and window glow differ from IMAGE 1. "
    "TASK: relight IMAGE 1 as blue hour, about twenty minutes after sunset, with the identical camera and framing, a change of lighting only (the "
    "result must overlay IMAGE 1 pixel for pixel in its structure). Only light, sky, glow and people change. SKY: deep "
    "blue at the top fading to a thin band of warm peach and rose at the horizon behind the roofline, and the tree line behind the roofs is exactly the one in IMAGE 1, a few soft "
    "violet-grey clouds, the tree canopy behind the roofs now dark teal silhouettes. WINDOWS AND LIGHT: warm amber glow "
    "from the interiors of the existing windows and balcony bays (soft curtains, a ceiling light, a hanging chair glowing), "
    "warm light spilling out of the car porches, small warm lamps beside the existing entrances, soft warm uplighting on the "
    "brick pillars and palms, gentle cool blue ambient light on the white portal frames and the lawn, wet-looking pavers "
    "catching soft reflections of the windows. The few existing people stay in the same places, as small candid residents "
    "now lit by the warm light from the porches, nobody looking at the camera. Keep full detail in the shaded facades. "
    + DO_NOT
)

if __name__ == "__main__":
    suffix = sys.argv[1] if len(sys.argv) > 1 else ""
    gen_image("ss26-row-houses-dusk" + suffix, PROMPT, inputs=[SRC], aspect="21:9",
              summary="SS-26 same-camera dusk edit (blue hour, warm windows), strict edit")
