#!/bin/sh
# Downloads the OFL fonts used by the logo concepts from the google/fonts GitHub repo into a scratch folder.
# Usage: sh fetch_fonts.sh <fonts-dir>
set -eu
DEST="${1:?fonts dir}"
BASE="https://raw.githubusercontent.com/google/fonts/main/ofl"
fetch() { # family file...
  fam="$1"; shift
  mkdir -p "$DEST/$fam"
  for f in "$@" OFL.txt; do
    if [ ! -s "$DEST/$fam/$f" ]; then
      curl -fsSLg -o "$DEST/$fam/$f" "$BASE/$fam/$(printf '%s' "$f" | sed 's/\[/%5B/g; s/\]/%5D/g')"
    fi
  done
}
fetch playfair "Playfair[opsz,wdth,wght].ttf"
fetch zalandosansexpanded "ZalandoSansExpanded[wght].ttf"
fetch pinyonscript "PinyonScript-Regular.ttf"
fetch bodonimoda "BodoniModa[opsz,wght].ttf"
fetch marcellus "Marcellus-Regular.ttf"
fetch cormorantgaramond "CormorantGaramond[wght].ttf"
fetch castorotitling "CastoroTitling-Regular.ttf"
fetch tenorsans "TenorSans-Regular.ttf"
fetch monasans "MonaSans[wdth,wght].ttf"
fetch jost "Jost[wght].ttf"
fetch notoserifdisplay "NotoSerifDisplay[wdth,wght].ttf"
fetch italiana "Italiana-Regular.ttf"
echo "fonts ready in $DEST"
