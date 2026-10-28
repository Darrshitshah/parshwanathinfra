"""
Trace the Vapi-Silvassa Road (OSM state highway SH185, unnamed between Vapi and Silvassa) out of OpenFreeMap's vector
tiles into a small GeoJSON line for the location map's gold road (src/components/map/vapi-silvassa-road.json).

The tiles only carry SH185 from zoom 12, so the map cannot pick it out of the tiles at the Vapi-to-Silvassa zoom; this
static trace draws it at every zoom. Data: OpenStreetMap contributors (ODbL), credited on the map.

Usage (from the project root):
  uv run --no-project --python 3.12 --with mapbox-vector-tile --with matplotlib python tools/map/trace_road.py \
      --out src/components/map/vapi-silvassa-road.json --plot /tmp/road.png
"""
import argparse
import json
import math
import urllib.request

import mapbox_vector_tile as mvt

TILEJSON = "https://tiles.openfreemap.org/planet"
REF = "SH185"
EXCLUDED_NAME = "Daman Road"
ZOOM = 13
# Box from the NH48 junction at Vapi to Silvassa (lng/lat). West of it SH185 turns towards Daman and is left out.
BOX = (72.92, 20.24, 73.05, 20.40)
HEADERS = {"User-Agent": "Mozilla/5.0 (parshwanath-infra map trace)"}


def fetch(url, attempts=4):
    for attempt in range(attempts):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30).read()
        except OSError:
            if attempt == attempts - 1:
                raise


def tile_xy(lng, lat, z):
    n = 2**z
    r = math.radians(lat)
    return int((lng + 180) / 360 * n), int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n)


def to_lnglat(x, y, z, px, py, extent):
    n = 2**z
    gx = (x + px / extent) / n
    gy = (y + 1 - py / extent) / n
    return round(gx * 360 - 180, 5), round(math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * gy)))), 5)


def collect(template):
    x0, y0 = tile_xy(BOX[0], BOX[3], ZOOM)
    x1, y1 = tile_xy(BOX[2], BOX[1], ZOOM)
    lines = []
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            url = template.replace("{z}", str(ZOOM)).replace("{x}", str(x)).replace("{y}", str(y))
            layer = mvt.decode(fetch(url)).get("transportation_name", {})
            extent = layer.get("extent", 4096)
            for feature in layer.get("features", []):
                props = feature["properties"]
                if props.get("ref") != REF or props.get("name") == EXCLUDED_NAME:
                    continue
                geometry = feature["geometry"]
                parts = [geometry["coordinates"]] if geometry["type"] == "LineString" else geometry["coordinates"]
                for part in parts:
                    lines.append([to_lnglat(x, y, ZOOM, px, py, extent) for px, py in part])
    return lines


BIN_METRES = 80


def centreline(lines):
    """One line through all pieces: the road runs one way (Vapi north-west to Silvassa south-east), so points are
    binned along that axis and averaged, which merges dual-carriageway pieces and tile seams into a single centreline
    that a label can follow."""
    points = [p for line in lines for p in line]
    start = max(points, key=lambda p: p[1] - p[0])
    end = min(points, key=lambda p: p[1] - p[0])
    kx = 111_320 * math.cos(math.radians(20.3))
    ky = 110_570
    ax, ay = (end[0] - start[0]) * kx, (end[1] - start[1]) * ky
    length = math.hypot(ax, ay)
    bins = {}
    for lng, lat in points:
        t = ((lng - start[0]) * kx * ax + (lat - start[1]) * ky * ay) / length
        bins.setdefault(int(t // BIN_METRES), []).append((lng, lat))
    return [
        (round(sum(p[0] for p in group) / len(group), 5), round(sum(p[1] for p in group) / len(group), 5))
        for _, group in sorted(bins.items())
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--plot")
    args = parser.parse_args()
    template = json.loads(fetch(TILEJSON))["tiles"][0]
    lines = collect(template)
    inside = [l for l in lines if all(BOX[0] <= lng <= BOX[2] and BOX[1] <= lat <= BOX[3] for lng, lat in l)]
    print(f"{len(inside)} SH185 pieces")
    for line in inside:
        print(len(line), line[0], line[-1])
    if args.plot:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(8, 8))
        line = centreline(inside)
        ax.plot([p[0] for p in line], [p[1] for p in line], lw=3, color="#a58039", alpha=0.5)
        for i, line in enumerate(inside):
            ax.plot([p[0] for p in line], [p[1] for p in line], lw=1)
            ax.annotate(str(i), line[len(line) // 2], fontsize=6)
        ax.plot([72.9932563], [20.2934524], "ro")
        ax.set_aspect(1 / math.cos(math.radians(20.3)))
        fig.savefig(args.plot, dpi=120)
    feature = {
        "type": "Feature",
        "properties": {"ref": REF, "source": "OpenStreetMap contributors (ODbL), via OpenFreeMap tiles, zoom 13"},
        "geometry": {"type": "LineString", "coordinates": centreline(inside)},
    }
    with open(args.out, "w") as handle:
        json.dump({"type": "FeatureCollection", "features": [feature]}, handle, separators=(",", ":"))
        handle.write("\n")


if __name__ == "__main__":
    main()
