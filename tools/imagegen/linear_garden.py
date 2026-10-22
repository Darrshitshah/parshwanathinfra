"""Amenity card: artist's impression of the linear garden with a water feature (plan item `linear-garden`).
Strict edit of SS-30 (row-house lane, long view). Usage: python tools/imagegen/linear_garden.py [suffix]
Output: _source/generated/amenities/linear-garden[suffix].png (+ .prompt.txt next to it)."""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import _lib
from _lib import STRICT, DO_NOT, V2, gen_image

SRC = V2 / "SS-30 Row House Lane Long View Model - hiranandani.png"
PROMPT = (
    "IMAGE 1 is a photoreal view down a long lane between the two-storey row houses of Shiv Shiva Township, Gujarat, India, "
    "at golden hour. " + STRICT + " "
    "TASK: keep every building, facade, white portal frame, red brick pillar, olive wall, planter, sky and the camera exactly "
    "as in IMAGE 1. Change only the ground of the wide middle of the lane: turn the central paved strip into a landscaped "
    "LINEAR GARDEN running away from the camera down the middle of the view, with a narrow paved internal road kept along "
    "each side of it next to the house frontages (two internal roads with the garden between them). In the garden: a long "
    "clipped lawn, a low planted border with flowering shrubs, a row of young trees on each edge of the garden, a paved "
    "walking path, two or three benches, and a central rectangular water feature with a gently playing fountain and a low "
    "stone coping about a third of the way down the garden, catching the golden light. Residents in candid moments: an elderly "
    "couple on a bench, a mother with a child by the fountain, two people walking, nobody looking at the camera. Warm golden "
    "low sun, long soft shadows. Nothing else is added: no new buildings, no towers, no gate, no signs. " + DO_NOT
)

if __name__ == "__main__":
    suffix = sys.argv[1] if len(sys.argv) > 1 else ""
    _lib.GEN = _lib.GEN / "amenities"
    gen_image("linear-garden" + suffix, PROMPT, inputs=[SRC], aspect="3:2", size="2K",
              summary="Linear garden with fountain between two internal roads: strict edit of SS-30 lane long view (artist's impression)")
