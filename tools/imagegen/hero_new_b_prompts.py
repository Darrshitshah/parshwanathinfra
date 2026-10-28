"""Veo prompt table for hero_new_b take (closing half of the new hero film)."""
SOLID = ("Every building keeps one design throughout: an open stilt-parking ground storey, five floors of windows with white frames and charcoal "
         "railings, and a flat roof terrace. This is a low-rise township: no building is ever taller than six levels, there are no towers and no "
         "tall buildings anywhere. No building appears, vanishes, grows, shrinks, ghosts, fades or changes shape; every building is solid and "
         "opaque in every frame. Warm golden morning light. No text.")
PV = {
    # RISE1: mid1 -> NOD (same buildings, higher and wider SS-01 camera pose, the row-house district not built yet).
    "RISE1": ("One slow, smooth, continuous cinematic drone shot at golden hour, with a gentle ease-in at the start and an ease-out at the end. The "
              "camera starts at the first frame's view and rises steadily while pulling back and turning very slightly, to the higher, wider view of "
              "the last frame, where it settles. It never descends, never swoops, never cuts and never gets closer than the first frame. The township "
              "stays exactly the same cluster of apartment blocks in the same arrangement; as the camera rises it simply shows more of the "
              "countryside around it: fields, hedgerows, trees and the highway on the right. The lawns and trees around the blocks grow a little "
              "fuller. " + SOLID),
    # GROW1: NOD -> SS-01 on a locked camera: the row-house district rises in the upper left.
    "GROW1": ("A nearly locked-off drone shot at golden hour: the camera barely drifts and ends exactly on the last frame. The apartment blocks, the "
              "lawns, the forecourt, the highway and the horizon never change. In the open countryside in the upper left, beyond the apartment blocks, "
              "the township's two and three storey row houses are built in a quick, smooth time-lapse: long terraced rows rise from the ground "
              "one after another, from front to back, until the rows stand exactly as in the last frame with their palm-lined lane. The row houses "
              "are low, never taller than three storeys. " + SOLID),
    # MIST1: mid1 -> ss01; the camera rises through a bank of golden mist; the layout change (the township's fuller arrangement) happens
    # while the mist fills the frame, instead of a cross-dissolve. Camera settles on the last frame.
    "MIST1": ("One slow, smooth, continuous cinematic drone shot at golden hour, with a gentle ease-in. The camera starts at the first frame's view "
              "and rises steadily, never descending and never cutting. After about two seconds a soft bank of warm golden-white morning mist "
              "drifts in and thickens until it fills the whole frame for a moment (about three to four seconds), the camera passing up through it. "
              "The camera emerges above the mist as it thins and clears, and settles on the higher, wider view of the last frame, where it stays "
              "perfectly still for the final two seconds. When the mist has cleared the township stands in its full arrangement exactly as in the "
              "last frame, with its further rows of low row houses in the upper left and the lawns in front. Before and after the mist the buildings "
              "never fade or dissolve; only the mist hides the change. " + SOLID),
    # GROUNDS1: stage-5-aligned -> mid1: same buildings and nearly the same camera; the building site around them is turned into landscaped grounds.
    "GROUNDS1": ("One slow, smooth, continuous drone shot at golden hour: the camera rises very gently and pulls back a little, never descending, "
                 "never cutting, never swooping, ending on the last frame's slightly higher view. The apartment blocks stand finished and unchanged in "
                 "the same places in every frame. The landscaping of the grounds is completed in a smooth natural time-lapse: the bare dirt yard, "
                 "the trucks, brick stacks and sand heaps are cleared away and replaced by a paved forecourt, a curved road loop with a roundabout, "
                 "lawns and planting; young trees along the roads and around the blocks grow into full canopy and the fields beyond turn greener, "
                 "exactly as in the last frame. Nothing fades or ghosts through the buildings. " + SOLID),
    # MIST2: MIST1 passed visually but the layout change showed as a 0.4 s double exposure at 5.3-5.7 s while the mist was already thinning.
    # Ask for a complete white-out at the moment of the change.
    "MIST2": ("One slow, smooth, continuous cinematic drone shot at golden hour, with a gentle ease-in. The camera starts at the first frame's view "
              "and rises steadily, never descending and never cutting. After about one and a half seconds a thick bank of warm golden-white mist "
              "rolls in from below and from the sides and swallows the whole township. For about one full second, around the middle of the shot, "
              "the frame is a complete white-out: nothing but dense, glowing golden-white cloud is visible, no building, no ground. The camera keeps "
              "rising through it. Then the mist drops away downwards and the camera emerges above it at the higher, wider view of the last frame, "
              "settling and staying perfectly still for the final two seconds. The township that is revealed is the full township exactly as in the "
              "last frame, with its further rows of low row houses in the upper left and the lawns in front. Buildings never fade or dissolve into "
              "each other in the clear air; only the dense cloud hides the change. " + SOLID),
    # LIVE1: first frame = last frame = ss01. A living hold: the picture stays the poster, only small life moves.
    "LIVE1": ("A nearly locked-off aerial drone shot at golden hour that holds on the finished township: the camera is almost perfectly still, with "
              "only an imperceptibly slow, tiny drift that returns to exactly the first frame. Only small signs of life move: a few cars drive "
              "slowly along the highway on the right and along the inner roads, the leaves and treetops sway gently in a light breeze, the lawns "
              "and palms stir slightly, and the low sun makes a soft warm glimmer across the scene. Every building is perfectly still, solid and "
              "unchanged in every frame; nothing is added, removed or changed anywhere; the shot ends on exactly the same picture as it begins. "
              "No mist, no clouds moving, no birds, no people. " + SOLID),
    # SEG4N: lead A's 4b (PASS) with the one flaw fixed: the left blocks' walls faded in semi-transparent for ~0.8 s.
    "SEG4N": ("One continuous shot from a fixed camera high above the site, like a webcam: the framing never changes, no zoom, no pan, no tilt, no "
              "push-in, no cuts. Low-rise housing blocks of six levels; there are no tall buildings anywhere at any time. The farmland, trees, farm "
              "huts, the dirt yard with the truck, brick stacks and steel bars, the road on the right and the horizon stay exactly still. The blocks "
              "never change their outline or height: each keeps the same footprint and roofline from the first frame to the last, and only its surface "
              "is finished in place, one block after another from the right to the left: green netting wraps a block, then falls away to show "
              "finished solid walls; on the open concrete blocks at the left the brick infill and plaster walls and windows are built up floor by "
              "floor from the bottom, every wall solid and opaque the moment it appears, never faded, never see-through. The walls take a warm khaki "
              "sand-olive paint with white window frames and charcoal railings, and the two yellow cranes are dismantled and gone by six seconds. "
              "By the end every block shows an open stilt-parking ground floor, five floors of windows and a roof terrace, exactly as in the last "
              "frame. Warm golden morning light. No text."),
    # SEG4N2: SEG4N failed (the big front-right block beside the road vanished 0.5 to 7 s and popped back, as in lead A's 4c).
    "SEG4N2": ("One continuous shot from a fixed camera high above the site, like a webcam: the framing never changes, no zoom, no pan, no tilt, no "
               "push-in, no cuts. Low-rise housing blocks of six levels; there are no tall buildings anywhere at any time. EVERY building, including "
               "the large front block beside the road on the right and all the blocks at the left, stays visible in its own place in every single "
               "frame from the first frame to the last: no building ever disappears, shrinks, sinks into the ground or is replaced by bare earth, and "
               "no building appears from nowhere. The farmland, trees, farm huts, the dirt yard with the truck, brick stacks and steel bars, the road "
               "on the right and the horizon stay exactly still. Each block keeps its footprint and roofline, and only its surface is finished in "
               "place, a few blocks at a time: green netting wraps some blocks and then falls away to finished solid walls; the open concrete "
               "frames at the left fill with solid walls and windows from the bottom up, every wall solid and opaque the moment it appears, never "
               "faded or see-through. The walls take a warm khaki sand-olive paint with white window frames and charcoal railings; the two yellow "
               "cranes are dismantled and gone by six seconds. By the end every block shows an open stilt-parking ground floor, five floors of windows "
               "and a roof terrace, exactly as in the last frame. Warm golden morning light. No text."),
}
