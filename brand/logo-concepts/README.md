# Parshwanath Infra · logo concepts (work in progress)

Status: checkpoint 1 (2026-10-22). **No concept is drawn yet**: no SVG, board, overview sheet or mockup exists.
Done so far: research of the site and plan, the full design plan for all ten concepts (below), the font downloader and
the geometry and text-to-outline library. The next session only has to draw, render and review.

## Done
- `_build/fetch_fonts.sh`: downloads the OFL fonts from the google/fonts GitHub repo into the scratch folder.
- `_build/lib.py`: exact bezier booleans (skia-pathops), arcs, rings, sectors, rounded rects, stroke outlining, HarfBuzz
  shaping with kerning and variable-font instances, text to outlines, text on a circle (top and bottom arcs), SVG writers
  (single colour via `currentColor`, colour by layer role, inline SVG with role classes for the boards). Not yet run.
- Research: site look (Playfair condensed caps, Pinyon Script accent, Zalando Sans Expanded labels, ring and dot seal),
  `src/content/plan/plan.json` (boundary polygon, roundabout at 1320,651 r30, boulevard east to the main entry, spine
  west, a NW diagonal and a south road leave the roundabout), the existing Shiv Shiva project logo (S in a vesica).

## Missing (all visual work)
Per concept: `NN-name/mark.svg`, `horizontal.svg`, `stacked.svg` (single colour), `*-color.svg` (gold on light) and
`*-color-dark.svg` (gold and ivory on dark), `board.png`. Then `logo-concepts-sheet.png` (about 2400 px wide, 2 columns),
the final README with rationale per concept, optional HTML mockups (signboard, letterhead, hoarding) for the top 3.

## The ten concepts (planned)
| # | Folder | Idea | Type and fonts |
|---|---|---|---|
| 01 | `01-the-heart` | A P drawn as the road into the township: the stem is the boulevard, the bowl is the roundabout ring, a dot is the island. The site seal (ring and dot) grows a stem. Heavy monoline (stroke about 14 % of height) so it holds at 32 px. | Lettermark · Zalando Sans Expanded 600 (matches the header) |
| 02 | `02-open-court` | A P from six plots on a 3x3 planning grid; the two right cells are quarter-rounded to draw the bowl; the centre cell is a circle, the open court (aangan) at the heart, as the roundabout is in the township. | Grid lettermark · Marcellus |
| 03 | `03-the-township` | The real Shiv Shiva boundary from plan.json, simplified to a surveyed polygon, with the boulevard and roundabout cut out. Same shape as the site's page curtain. Weak at 32 px: use with a ring or roundabout favicon. | Place mark · Playfair condensed + Zalando |
| 04 | `04-stone-on-stone` | A doorway of stone courses stepping inward (corbel construction, as in Gujarat's stepwells and Solanki temples): foundation and home in one. | Architectural · Castoro Titling |
| 05 | `05-sheltering-arch` | **Heritage 1.** A doorway with a seven-lobed cusped arch: reads as Indian architecture; the seven lobes quietly echo the sheltering canopy of Parshvanatha. Abstract, never a figure. | Architectural · Cormorant Garamond |
| 06 | `06-signature` | Wordmark only: PARSHWANATH in condensed high-contrast caps with "Infra" in script overlapping, exactly the site hero's language. Favicon: the serif P. | Wordmark · Playfair (wdth 87.5) + Pinyon Script |
| 07 | `07-the-seal` | **Heritage 2.** Document crest: PARSHWANATH INFRA on the top arc, VAPI · GUJARAT on the bottom, a ring of 23 beads (a quiet nod to the 23rd Tirthankara, swap for a plain ring if unwanted), the real roundabout with its four roads (E, W, NW, S) at the centre. | Seal · Zalando + Playfair |
| 08 | `08-the-key` | The handover key: an arch-shaped bow (the site's arch frame), the shaft as the boulevard, the bit cut like a row of plots. Replaces "drawn to life" (static line drawings fail at 32 px; 01 and 03 already animate with the site's inkDraw and boundary curtain). | Pictorial · Tenor Sans |
| 09 | `09-true` | A faceted plumb bob on its line: built true, upright, honest; two gold facets read as a jewel. | Symbol · Jost or Mona Sans |
| 10 | `10-monogram` | A classic high-contrast P and I monogram inside a tall arch cartouche, for an established, jeweller-like feel. | Monogram · Bodoni Moda |

Heritage appears only in 05 and 07. Avoided on purpose: a lotus (it is a political party symbol in India), house roofs,
swooshes, a bold P in a square (reads as a parking sign), any Jain figure or serpent.

Colours for the gold direction: ink green `#14261E`, espresso `#2A1D16`, ivory `#F4F0E6`, antique gold on light
`#A5834B`, champagne gold on dark `#CFAE70`, maroon `#4C0F27`.

## Top 3 (provisional, before seeing renders)
1. **01 The Heart**: grows straight out of the seal already on the site, simplest at favicon size, works for every
   future project. 2. **02 Open Court**: the cleverest single idea (a P made of plots around an open heart), strong small.
   3. **05 Sheltering Arch**: the most beautiful and Indian, and the subtle heritage option. Confirm after the boards.

## Fonts (all SIL Open Font License 1.1, Google Fonts)
Playfair, Zalando Sans Expanded, Pinyon Script, Bodoni Moda, Marcellus, Cormorant Garamond, Castoro Titling, Tenor Sans,
Mona Sans, Jost (plus Noto Serif Display and Italiana downloaded as spares). Text is converted to outlines.

## How to resume
```sh
cd "/Users/darshit/CLAUDE the GOD/Parshwanath portfolio "
F="/private/tmp/claude-501/-Users-darshit-CLAUDE-the-GOD/5d993e2f-4b5c-4758-9760-bc277ad574b1/scratchpad/logo/fonts"
sh brand/logo-concepts/_build/fetch_fonts.sh "$F"          # if the scratch fonts were wiped
UV="$HOME/.local/bin/uv run --no-project --python 3.12 --with fonttools --with brotli --with uharfbuzz --with skia-pathops"
LOGO_FONTS="$F" $UV python -c "import sys; sys.path.insert(0, 'brand/logo-concepts/_build'); import lib"   # smoke test
```
Next steps: 1. write `_build/concepts.py` (one function per concept returning mark, horizontal and stacked `Art`) and
`_build/build.py` (writes the SVGs and a board HTML per concept); 2. write `_build/render.mjs` that resolves Playwright
from the project with `createRequire("<project>/package.json")` and screenshots with `chromium.launch({ channel: "chrome" })`
at deviceScaleFactor 1 (honest 32 px favicon test); 3. look at every board and iterate; 4. overview sheet, README, mockups.
No git, no npm installs; the parent folder is a live trading workspace and is never touched.
