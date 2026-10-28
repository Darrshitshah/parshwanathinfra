# Parshwanath Infra · logo concepts

Status: checkpoint 4 (2026-10-23). Concepts 01 to 09 are drawn, each with SVG files and a board. Concept 10
(Monogram) is not drawn. Overview: `logo-concepts-sheet.png` (portrait, 1600 px wide, one tile per concept).

## Files per concept (`NN-slug/`)
- `mark.svg`, `horizontal.svg` (mark + PARSHWANATH INFRA), `stacked.svg`: espresso `#231a12`, one colour.
- `*-gold.svg`: site gold `#a58039`, for light grounds. `*-gold-dark.svg`: warm gold `#d9b263`, for dark grounds.
- `favicon.svg`: the small-size version centred in a square (browser tab, app icon).
- `board.png`: champagne paper, espresso reversed, gold on dark, 512 / 64 / 32 / 16 px (rendered at device scale 1,
  so the small sizes are honest), round WhatsApp and Instagram avatars.
- All text is converted to outlines: no font is needed to open or print any file.

## The concepts (idea · why)
| # | Name | Idea · why |
|---|---|---|
| 01 | The Heart | The site's ring and dot grow a stem and become a P; the dot is the roundabout island. · Grows out of the seal already on the site, reads as a P even at 16 px. Zalando Sans Expanded. |
| 02 | Open Court | A P laid out as a site plan: nine plots and the streets between them, the counter left open as the court. · Vastu keeps the centre of a home free (Brahmasthan); a clever P that stays solid small. Marcellus. |
| 03 | The Township | A square of land cut by the township's real roads (boulevard, spine, diagonal, 20 ft road) meeting at the roundabout, from `plan.json`. · Nobody else can own it; bold, holds at 16 px. Playfair condensed + Zalando. |
| 04 | Stone on Stone | A corbelled doorway: stone courses step inward until a capstone closes the gap, as in Gujarat's stepwells (vav) and Solanki temples. · Foundation and home in one figure; closes into a clean doorway when small. Castoro Titling. |
| 05 | Sheltering Arch | Heritage 1: a seven-lobed cusped arch (the torana of Modhera and Vadnagar) standing on an otla, the raised threshold of a Gujarati home. · Most Indian and most beautiful; seven lobes quietly echo Parshvanatha's canopy; matches the site's arch frames. Cormorant Garamond. |
| 06 | Signature | Wordmark: PARSHWANATH in condensed caps with "Infra" in script crossing it, a hairline gap cut so it works in one colour. · Exactly the site hero's voice; the favicon is only a capital P, so it is the weakest small. Playfair + Pinyon Script. |
| 07 | The Seal | Heritage 2: a document seal with the name on the arcs, 23 beads (the 23rd Tirthankara; a plain ring also works) and an eight-direction Vastu compass. Favicon: solid disc with the compass cut out. · For allotment letters, receipts, stamps. Zalando + Noto Serif Display. |
| 08 | The Key | The handover key; its bow is the site's arch frame, so the key and the door it opens are one figure. · The buyer's happiest day; one stroke throughout. Tenor Sans. |
| 09 | True | A faceted plumb bob on its line, pointing at its mark; in profile a cut jewel, two facets carry the gold. · Built true, honestly. Thin, so the favicon crops to the bob. Jost. |
| 10 | Monogram | Not drawn. Planned: interlaced P and I in Bodoni Moda inside a fine oval. |

## Top 3 (after seeing the boards)
1. **05 Sheltering Arch**: the most beautiful and the most Indian. The heritage nod stays subtle, it matches the site's
   arch-shaped image frames, and the otla keeps it distinctive at 32 px.
2. **02 Open Court**: the cleverest single idea (a P made of plots around an open court, with the Vastu story buyers
   in Gujarat care about); a strong, solid shape at every size and in one colour.
3. **03 The Township**: the only mark nobody else could own, drawn from the real plan; the boldest favicon of the set.
   Caveat: it describes Shiv Shiva Township, so future projects inherit its plan.
Runners-up: 01 (the easiest continuation of the current site seal) and 06 (the most premium wordmark, weak favicon).

## Decisions made while drawing
- 03 changed: the boundary outline was tested in eight treatments (raw, simplified, rotated, survey traverse, ring,
  disc, plate, sheet frame); at logo sizes it reads as an animal head or a car. The road plan is stronger and still
  real. The boundary stays a graphic device (page curtain, hoardings).
- 07 centre is a Vastu compass instead of the roundabout, so the roundabout appears only in 01 and 03.
- 09 facets were redrawn: the first version's joints formed a cross on the bob.
- Avoided on purpose: a lotus (political party symbol in India), house roofs, swooshes, a bold P in a square, any
  Jain figure or serpent. No AI image generation; every shape is drawn in code.

## Missing / not done
- Concept 10 (Monogram) is not drawn (prototype script only, in the scratch folder).
- No signboard or letterhead mockups yet.
- Final polish pass not done: centre the stacked text of 01, lighten 01's stroke slightly, show the two-colour
  (gold accent) versions of 01, 06 and 09 on their boards.

## Next steps (simple)
1. Darshit picks one number from `logo-concepts-sheet.png` (or two to combine).
2. Polish the chosen mark (optical corrections, small-size version), fix the lockup type, then make the site favicon,
   apple icon, letterhead, visiting card and signboard from it.

## Fonts (all SIL Open Font License 1.1, Google Fonts)
Playfair, Zalando Sans Expanded, Pinyon Script, Marcellus, Cormorant Garamond, Castoro Titling, Tenor Sans, Jost,
Noto Serif Display (Bodoni Moda, Mona Sans, Italiana downloaded as spares). Text is converted to outlines.

## How to resume
```sh
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
F="/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/logo/fonts"
sh brand/logo-concepts/_build/fetch_fonts.sh "$F"                                  # only if the scratch fonts were wiped
sh brand/logo-concepts/_build/py.sh brand/logo-concepts/_build/build.py 05 --proof  # build + render one concept
sh brand/logo-concepts/_build/py.sh brand/logo-concepts/_build/build.py all          # every concept
sh brand/logo-concepts/_build/py.sh brand/logo-concepts/_build/sheet.py              # the overview sheet
```
Code: `_build/kit.py` (type setting, lockups, SVG writer), `_build/board.py` (board HTML), `_build/sheet.py`,
`_build/render.mjs` (Playwright from the project, system Chrome, device scale 1), `_build/concepts/cNN_*.py` (one
file per concept, registered in `_build/concepts/__init__.py`). Proofs go to `.../scratchpad/logo/work/`.
No git, no npm installs; the parent folder is a live trading workspace and is never touched.
