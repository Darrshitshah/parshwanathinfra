# Parshwanath Infra · logo concepts (work in progress)

Status: checkpoint 3 (2026-10-23). Concepts 01 to 07 are drawn (SVG files and board.png in their folders).
08, 09 and 10 are still to draw, then the overview sheet and the final pass. Plan for the rest is below.

## Files per concept (`NN-slug/`)
- `mark.svg`, `horizontal.svg` (mark + PARSHWANATH INFRA), `stacked.svg`: espresso `#231a12`, one colour.
- `*-gold.svg`: site gold `#a58039`, for light grounds. `*-gold-dark.svg`: warm gold `#d9b263`, for dark grounds.
- `favicon.svg`: the mark centred in a square, for browser tabs and app icons.
- `board.png`: champagne paper, espresso reversed, gold on dark, 512 / 64 / 32 / 16 px (rendered at device scale 1,
  so the small sizes are honest), round WhatsApp and Instagram avatars.
- All text is converted to outlines: no font is needed to open or print any file.

## Concepts
| # | Folder | Status | Idea |
|---|---|---|---|
| 01 | `01-the-heart` | drawn | The site's ring and dot grow a stem and become a P: the stem meets the ring the way an approach road meets a roundabout, the dot is the island. Zalando Sans Expanded. |
| 02 | `02-open-court` | drawn | A P laid out as a site plan: nine plots and the streets between them, the counter left open as the court (Vastu keeps the centre of a home free, the Brahmasthan). Marcellus. |
| 03 | `03-the-township` | drawn | The township's own plan cropped to a square of land: boulevard, spine, diagonal and 20 ft road meet at the roundabout at their real angles (from `plan.json`). Playfair condensed + Zalando. |
| 04 | `04-stone-on-stone` | drawn | Corbelled doorway: stone courses step inward until a capstone closes the gap, as in Gujarat's stepwells (vav) and Solanki temples. Castoro Titling; INFRA sits on a mortar-joint rule. |
| 05 | `05-sheltering-arch` | drawn | Heritage 1: a doorway with a seven-lobed cusped arch (the torana of Modhera and Vadnagar) on an otla, the raised threshold of a Gujarati home; seven lobes quietly echo Parshvanatha's canopy. Cormorant Garamond. |
| 06 | `06-signature` | drawn | Wordmark: PARSHWANATH in condensed caps with "Infra" in script crossing it (hairline gap cut so it works in one colour), the site hero's language. Favicon: the capital P. Playfair + Pinyon Script. |
| 07 | `07-the-seal` | drawn | Heritage 2: document seal, name on the arcs, a ring of 23 beads, an eight-direction Vastu compass at the centre; favicon is a solid disc with the compass cut out. Zalando + Noto Serif Display. |
| 08 | `08-the-key` | planned | The handover key: arch-shaped bow (a doorway in the key), bit cut like plots. Tenor Sans. |
| 09 | `09-true` | planned | A faceted plumb bob on its line, built true; its profile is a cut jewel. Jost. |
| 10 | `10-monogram` | planned | Interlaced P and I in high-contrast didone caps inside a fine oval cartouche. Bodoni Moda. |

## Decisions so far
- 03 changed: the boundary outline was drawn and tested in eight treatments (raw, simplified, rotated, outline with
  survey stations, inside a ring, a disc, a plate, a sheet frame). At logo sizes it reads as an animal head or a car.
  The road plan at the heart of the township is far stronger and still real. The boundary stays a graphic device
  (page curtain, hoardings, brochure covers).
- 07 centre changed from the roundabout to a Vastu compass so the roundabout appears only in 01 and 03.
- 10 container changed from an arch to an oval, because 05 (cusped arch) and 08 (arch bow) already use the arch.

Avoided on purpose: a lotus (political party symbol in India), house roofs, swooshes, a bold P in a square (reads as a
parking sign), any Jain figure or serpent.

## Fonts (all SIL Open Font License 1.1, Google Fonts)
Playfair, Zalando Sans Expanded, Pinyon Script, Bodoni Moda, Marcellus, Cormorant Garamond, Castoro Titling, Tenor Sans,
Jost (Mona Sans, Noto Serif Display and Italiana downloaded as spares). Text is converted to outlines.

## How to resume
```sh
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
F="/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/logo/fonts"
sh brand/logo-concepts/_build/fetch_fonts.sh "$F"                                  # only if the scratch fonts were wiped
sh brand/logo-concepts/_build/py.sh brand/logo-concepts/_build/build.py 04 --proof  # build + render one concept
sh brand/logo-concepts/_build/py.sh brand/logo-concepts/_build/build.py all          # everything
```
Code: `_build/kit.py` (type setting, lockups, SVG writer), `_build/board.py` (board HTML), `_build/render.mjs`
(Playwright from the project, system Chrome, device scale 1), `_build/concepts/cNN_*.py` (one file per concept,
registered in `_build/concepts/__init__.py`). Proofs go to the scratch folder `.../scratchpad/logo/work/`.
No git, no npm installs; the parent folder is a live trading workspace and is never touched.
