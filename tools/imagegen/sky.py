"""Step 1: sky plates for the S2 sky descent. Usage: python tools/imagegen/sky.py [plate-id ...]"""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _lib import gen_image

BASE = ("Photographic sky plate, 16:9, no buildings, no people, no birds, no aircraft, no text or logos. Soft monsoon-season "
        "clouds in warm golden-hour light, as seen from high above the plains of south Gujarat, India. Realistic, sharp, "
        "premium architectural-visualisation sky, creamy highlights, gentle blue-grey shadows in the cloud bases. ")
PLATES = {
    "sky-clouds-high": BASE + "High, thin, wispy cirrus and altostratus streaks drifting across a luminous pale-blue to warm "
        "peach sky, the low sun glowing just beyond the right edge, lots of open sky. Meant as the farthest cloud layer.",
    "sky-clouds-mid": BASE + "Mid-level billowing cumulus banks with golden-lit tops and soft grey-blue undersides, separated "
        "by clear gaps of warm blue sky, sunlight rimming the edges. Meant as the middle cloud layer, clouds distributed "
        "across the whole frame with clear sky between them.",
    "sky-clouds-low": BASE + "A near, dense low blanket of soft white-gold cloud tops filling the lower two thirds of the "
        "frame, seen from just above them, with a few bright gaps and a clear warm sky above. Meant as the nearest layer "
        "that the camera dives through.",
    "sky-dive-first-frame": BASE + "Looking forward and slightly down from a high vantage point just above a layer of soft "
        "golden cloud tops: scattered soft clouds in the lower half through which a hazy, distant green plain with tree groves "
        "and farm fields is faintly visible, a soft hazy horizon about one quarter down from the top, a luminous warm sky "
        "above it with a few light clouds, low sun to the left behind the clouds. Calm, clean, uncluttered composition.",
}
if __name__ == "__main__":
    ids = sys.argv[1:] or list(PLATES)
    for i in ids:
        gen_image(i, PLATES[i], aspect="16:9", summary=f"sky plate {i}")
