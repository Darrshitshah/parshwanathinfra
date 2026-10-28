/**
 * Our own MapLibre style for OpenFreeMap's OpenMapTiles vector tiles: every colour comes from the site's tokens (mixed in
 * map-colour.ts), labels are set in the site's sans (Zalando Sans Expanded, drawn locally from `public/map/fonts`), and
 * the Vapi-Silvassa Road is the one gold line. No default map look anywhere. Pure functions, no MapLibre runtime
 * import, so this file is unit-tested and costs nothing in any page bundle. Owner: pages-lead.
 */
import type {
  ExpressionSpecification,
  FilterSpecification,
  FontFacesSpecification,
  LayerSpecification,
  StyleSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { luminance, mix, withAlpha } from "./map-colour";
import featureRoad from "./vapi-silvassa-road.json";

/** OpenFreeMap: free vector tiles, no key, OpenMapTiles schema (the TileJSON points at the current planet build). */
export const TILEJSON_URL = "https://tiles.openfreemap.org/planet";
/** Glyph PBFs, only used for scripts our own font files do not cover. */
export const GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const SOURCE_ID = "openmaptiles";
/** The gold road: a static trace of the Vapi-Silvassa Road from OSM (tools/map/trace_road.py), drawn at every zoom. */
export const FEATURE_SOURCE_ID = "vapi-silvassa-road";
const FEATURE_LABEL_SOURCE_ID = "vapi-silvassa-road-label";
/**
 * The road name. At the opening overview the gold line and the card's address carry it (a rotated tag there kept
 * colliding with Vapi and Dadra, which matter more). From TAG_MINZOOM two rotated tags name it, and from
 * LINE_LABEL_MINZOOM a label follows the line (below that the tile pieces are too short for one).
 */
const TAG_MINZOOM = 12.5;
const LINE_LABEL_MINZOOM = 14;
/** Where along the road (0 = Vapi, 1 = Silvassa) the tags sit, and how much road each angle is averaged over. */
const TAGS = [{ position: 0.5 }, { position: 0.92 }] as const;
const TAG_SPAN = 0.2;

/** The two text styles. The names exist on OpenFreeMap's glyph server, so anything our files miss still renders. */
const FONT_TEXT = "Noto Sans Regular";
const FONT_STRONG = "Noto Sans Bold";

export const MAP_FONT_FILES = {
  regular: "/map/fonts/zalando-sans-expanded-latin-400.woff2",
  strong: "/map/fonts/zalando-sans-expanded-latin-600.woff2",
  extended: "/map/fonts/zalando-sans-expanded-latin-ext.woff2",
} as const;

const LATIN = ["U+0000-00FF", "U+0131", "U+0152-0153", "U+02BB-02BC", "U+02C6", "U+02DA", "U+02DC", "U+2000-206F", "U+20AC", "U+2122", "U+2212"];
const LATIN_EXTENDED = ["U+0100-024F", "U+1E00-1EFF", "U+20A0-20AB", "U+20AD-20C0", "U+2C60-2C7F", "U+A720-A7FF"];

/** The site tokens the map is drawn from (resolved to hex by map-runtime.ts). */
export interface MapTokens {
  paper: string;
  paperRaised: string;
  paperSunk: string;
  ink: string;
  inkMuted: string;
  sand: string;
  brick: string;
  brickInk: string;
  forest: string;
  water: string;
}

export interface MapPalette {
  dark: boolean;
  land: string;
  farmland: string;
  urban: string;
  industrial: string;
  green: string;
  wood: string;
  water: string;
  waterway: string;
  building: string;
  roadMinor: string;
  roadMinorCase: string;
  roadMajor: string;
  roadMajorCase: string;
  roadTrunk: string;
  roadTrunkCase: string;
  feature: string;
  featureCase: string;
  featureGlow: string;
  rail: string;
  boundary: string;
  label: string;
  labelMuted: string;
  labelWater: string;
  labelFeature: string;
  halo: string;
}

/** Champagne day or espresso night, mixed from whatever the tokens are in the map's colour block. */
export function paletteFromTokens(tokens: MapTokens): MapPalette {
  const dark = luminance(tokens.paper) < 0.2;
  const land = dark ? mix(tokens.paper, tokens.paperRaised, 0.35) : mix(tokens.paper, tokens.paperSunk, 0.55);
  const water = mix(land, tokens.water, dark ? 0.13 : 0.2);
  return {
    dark,
    land,
    farmland: mix(land, tokens.sand, dark ? 0.04 : 0.1),
    urban: mix(land, tokens.sand, dark ? 0.1 : 0.24),
    industrial: mix(land, tokens.sand, dark ? 0.14 : 0.34),
    green: mix(land, tokens.forest, dark ? 0.08 : 0.12),
    wood: mix(land, tokens.forest, dark ? 0.12 : 0.18),
    water,
    waterway: mix(water, tokens.ink, 0.08),
    building: mix(land, tokens.ink, dark ? 0.1 : 0.08),
    roadMinor: dark ? mix(land, tokens.ink, 0.12) : tokens.paperRaised,
    roadMinorCase: dark ? land : mix(land, tokens.ink, 0.14),
    roadMajor: dark ? mix(land, tokens.sand, 0.26) : mix(tokens.paperRaised, tokens.sand, 0.5),
    roadMajorCase: dark ? tokens.paperSunk : mix(tokens.sand, tokens.ink, 0.3),
    roadTrunk: dark ? mix(land, tokens.sand, 0.36) : mix(tokens.sand, tokens.brick, 0.22),
    roadTrunkCase: dark ? tokens.paperSunk : mix(tokens.sand, tokens.ink, 0.42),
    feature: tokens.brick,
    featureCase: dark ? tokens.paperSunk : tokens.brickInk,
    featureGlow: withAlpha(tokens.brick, dark ? 0.3 : 0.26),
    rail: mix(land, tokens.ink, dark ? 0.3 : 0.34),
    boundary: mix(land, tokens.ink, dark ? 0.32 : 0.36),
    label: tokens.ink,
    labelMuted: tokens.inkMuted,
    labelWater: mix(water, tokens.ink, 0.5),
    labelFeature: dark ? tokens.brick : tokens.brickInk,
    halo: land,
  };
}

export interface MapStyleOptions {
  palette: MapPalette;
  /** Absolute origin the font files are served from (font-faces need absolute URLs). */
  origin: string;
  /** The road name from the content, drawn along the emphasised road. */
  roadName: string;
  /** Paint transition when the theme changes, in ms (0 for reduced motion). */
  transitionMs?: number;
}

/** The Vapi-Silvassa Road in OSM: state highway SH185. Its tile copy is left to the gold trace and gets no label. */
export const FEATURE_ROAD_REF = "SH185";

const NAME: ExpressionSpecification = ["coalesce", ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];

const isLine: ExpressionSpecification = ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];
const isPolygon: ExpressionSpecification = ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false];

function byZoom(stops: ReadonlyArray<readonly [number, number]>, base = 1.4): ExpressionSpecification {
  return ["interpolate", ["exponential", base], ["zoom"], ...stops.flat()] as ExpressionSpecification;
}

function classIn(...classes: string[]): ExpressionSpecification {
  return ["match", ["get", "class"], classes, true, false];
}

function fill(id: string, sourceLayer: string, color: string, filter: FilterSpecification, minzoom = 0): LayerSpecification {
  return { id, type: "fill", source: SOURCE_ID, "source-layer": sourceLayer, minzoom, filter, paint: { "fill-color": color, "fill-antialias": true } };
}

interface RoadClass {
  id: string;
  classes: string[];
  fill: string;
  casing: string;
  width: ReadonlyArray<readonly [number, number]>;
  minzoom: number;
}

function roadLayers(road: RoadClass): LayerSpecification[] {
  const filter: FilterSpecification = ["all", isLine, classIn(...road.classes)];
  const shared = { type: "line" as const, source: SOURCE_ID, "source-layer": "transportation", minzoom: road.minzoom, filter };
  const layout = { "line-cap": "round" as const, "line-join": "round" as const };
  return [
    { ...shared, id: `${road.id}-casing`, layout, paint: { "line-color": road.casing, "line-width": byZoom(road.width.map(([z, w]) => [z, w + 1.6] as const)) } },
    { ...shared, id: road.id, layout, paint: { "line-color": road.fill, "line-width": byZoom(road.width) } },
  ];
}

function baseLayers(p: MapPalette): LayerSpecification[] {
  return [
    { id: "land", type: "background", paint: { "background-color": p.land } },
    fill("farmland", "landcover", p.farmland, ["all", isPolygon, classIn("farmland")], 9),
    fill("green", "landcover", p.green, ["all", isPolygon, classIn("grass", "wetland")], 9),
    fill("wood", "landcover", p.wood, ["all", isPolygon, classIn("wood")], 8),
    fill("urban", "landuse", p.urban, ["all", isPolygon, classIn("residential", "suburb", "neighbourhood", "quarter", "village")], 8),
    fill("industrial", "landuse", p.industrial, ["all", isPolygon, classIn("industrial", "commercial", "retail", "railway")], 9),
    fill("park", "park", p.green, isPolygon, 9),
    fill("water", "water", p.water, ["all", isPolygon, ["!=", ["get", "brunnel"], "tunnel"]]),
    {
      id: "waterway",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "waterway",
      minzoom: 9,
      filter: ["all", isLine, ["!=", ["get", "brunnel"], "tunnel"]],
      layout: { "line-cap": "round" },
      paint: { "line-color": p.waterway, "line-width": byZoom([[9, 0.6], [14, 2.2], [17, 5]]) },
    },
    {
      id: "building",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-color": p.building, "fill-opacity": byZoom([[14, 0], [15, 1]], 1) },
    },
  ];
}

function transportLayers(p: MapPalette): LayerSpecification[] {
  const roads: RoadClass[] = [
    { id: "road-minor", classes: ["minor", "service", "track"], fill: p.roadMinor, casing: p.roadMinorCase, width: [[12, 0.4], [14, 2], [17, 9]], minzoom: 12 },
    { id: "road-local", classes: ["tertiary", "secondary"], fill: p.roadMajor, casing: p.roadMajorCase, width: [[9, 0.5], [12, 1.4], [14, 3.4], [17, 12]], minzoom: 9 },
    { id: "road-primary", classes: ["primary"], fill: p.roadMajor, casing: p.roadMajorCase, width: [[8, 0.6], [11, 1.6], [14, 4.4], [17, 15]], minzoom: 8 },
    { id: "road-trunk", classes: ["trunk", "motorway"], fill: p.roadTrunk, casing: p.roadTrunkCase, width: [[7, 0.8], [11, 2.2], [14, 5.4], [17, 17]], minzoom: 7 },
  ];
  return [
    {
      id: "rail",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      minzoom: 10,
      filter: ["all", isLine, classIn("rail")],
      paint: { "line-color": p.rail, "line-width": byZoom([[10, 0.6], [16, 1.6]]), "line-dasharray": [3, 2] },
    },
    ...roads.flatMap(roadLayers),
  ];
}

type Position = [number, number];

/** Screen-space angle (degrees) from a to b in Web Mercator, so a tag sits along the road as drawn. */
function screenAngle([lng1, lat1]: Position, [lng2, lat2]: Position): number {
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const dx = ((lng2 - lng1) * Math.PI) / 180;
  const dy = mercY(lat1) - mercY(lat2);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle;
}

/** A point part-way along the road and the road's angle around it, for the low-zoom road tag. */
export function roadTag(coordinates: Position[], position: number, span = TAG_SPAN): { point: Position; rotate: number } {
  const last = coordinates.length - 1;
  const at = (fraction: number) => coordinates[Math.min(last, Math.max(0, Math.round(fraction * last)))];
  return {
    point: at(position),
    rotate: Math.round(screenAngle(at(position - span / 2), at(position + span / 2)) * 10) / 10,
  };
}

const ROAD_COORDINATES = featureRoad.features[0].geometry.coordinates as Position[];

function featureLayers(p: MapPalette): LayerSpecification[] {
  const shared = { type: "line" as const, source: FEATURE_SOURCE_ID };
  const layout = { "line-cap": "round" as const, "line-join": "round" as const };
  return [
    { ...shared, id: "feature-road-glow", layout, paint: { "line-color": p.featureGlow, "line-blur": byZoom([[8, 4], [14, 8]]), "line-width": byZoom([[8, 7], [12, 14], [16, 30]]) } },
    { ...shared, id: "feature-road-casing", layout, paint: { "line-color": p.featureCase, "line-width": byZoom([[8, 2.6], [12, 4.6], [14, 7.4], [17, 19]]) } },
    { ...shared, id: "feature-road", layout, paint: { "line-color": p.feature, "line-width": byZoom([[8, 1.6], [12, 3], [14, 5.4], [17, 16]]) } },
  ];
}

function boundaryLayer(p: MapPalette): LayerSpecification {
  return {
    id: "boundary-state",
    type: "line",
    source: SOURCE_ID,
    "source-layer": "boundary",
    minzoom: 7,
    filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
    paint: { "line-color": p.boundary, "line-width": byZoom([[7, 0.6], [14, 1.4]]), "line-dasharray": [4, 3], "line-opacity": 0.7 },
  };
}

function labelLayers(p: MapPalette, roadName: string): LayerSpecification[] {
  const halo = { "text-halo-color": p.halo, "text-halo-width": 1.6, "text-halo-blur": 0.4 };
  const tagLayer = (id: string, minzoom: number, maxzoom: number): LayerSpecification => ({
    id,
    type: "symbol",
    source: FEATURE_LABEL_SOURCE_ID,
    minzoom,
    maxzoom,
    layout: {
      "text-field": roadName.toUpperCase(),
      "text-font": [FONT_STRONG],
      "text-size": byZoom([[12.5, 10], [14, 11]], 1),
      "text-letter-spacing": 0.16,
      "text-rotate": ["get", "rotate"],
      "text-rotation-alignment": "map",
      "text-pitch-alignment": "map",
      "text-max-width": 40,
      "text-offset": [0, 1.15],
    },
    paint: { "text-color": p.labelFeature, ...halo },
  });
  return [
    {
      id: "label-water",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "water_name",
      minzoom: 10,
      layout: { "text-field": NAME, "text-font": [FONT_TEXT], "text-size": 11, "text-letter-spacing": 0.06, "text-max-width": 8 },
      paint: { "text-color": p.labelWater, ...halo },
    },
    {
      id: "label-road",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "transportation_name",
      minzoom: 13,
      filter: ["all", isLine, ["has", "name"], ["!=", ["get", "ref"], FEATURE_ROAD_REF]],
      layout: { "symbol-placement": "line", "text-field": NAME, "text-font": [FONT_TEXT], "text-size": byZoom([[13, 10], [17, 13]], 1), "text-letter-spacing": 0.02 },
      paint: { "text-color": p.labelMuted, ...halo },
    },
    // Before the place names, so Vapi, Dadra and Silvassa win any collision and a tag gives way.
    tagLayer("label-feature-road-tag", TAG_MINZOOM, LINE_LABEL_MINZOOM),
    {
      id: "label-feature-road",
      type: "symbol",
      source: FEATURE_SOURCE_ID,
      minzoom: LINE_LABEL_MINZOOM,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 360,
        "text-max-angle": 70,
        "text-field": roadName.toUpperCase(),
        "text-font": [FONT_STRONG],
        "text-size": byZoom([[14, 11], [17, 12.5]], 1),
        "text-letter-spacing": 0.16,
        "text-offset": [0, -1.2],
      },
      paint: { "text-color": p.labelFeature, ...halo },
    },
    {
      id: "label-village",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "place",
      minzoom: 11,
      filter: classIn("village", "suburb", "hamlet", "neighbourhood", "quarter"),
      layout: { "text-field": NAME, "text-font": [FONT_TEXT], "text-size": byZoom([[11, 10], [15, 13]], 1), "text-max-width": 7, "text-letter-spacing": 0.02 },
      paint: { "text-color": p.labelMuted, ...halo },
    },
    {
      id: "label-town",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "place",
      minzoom: 8,
      filter: classIn("town"),
      layout: { "text-field": NAME, "text-font": [FONT_STRONG], "text-transform": "uppercase", "text-size": byZoom([[8, 9], [13, 12]], 1), "text-letter-spacing": 0.14 },
      paint: { "text-color": p.labelMuted, ...halo },
    },
    {
      id: "label-city",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "place",
      minzoom: 6,
      filter: classIn("city"),
      layout: { "text-field": NAME, "text-font": [FONT_STRONG], "text-transform": "uppercase", "text-size": byZoom([[6, 11], [10, 14], [14, 18]], 1), "text-letter-spacing": 0.18 },
      paint: { "text-color": p.label, ...halo, "text-halo-width": 2 },
    },
  ];
}

function roadTagCollection(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: TAGS.map(({ position }) => {
      const tag = roadTag(ROAD_COORDINATES, position);
      return { type: "Feature", properties: { rotate: tag.rotate }, geometry: { type: "Point", coordinates: tag.point } };
    }),
  };
}

export function mapFontFaces(origin: string): FontFacesSpecification {
  const url = (path: string) => new URL(path, origin).href;
  const extended = { url: url(MAP_FONT_FILES.extended), "unicode-range": LATIN_EXTENDED };
  return {
    [FONT_TEXT]: [{ url: url(MAP_FONT_FILES.regular), "unicode-range": LATIN }, extended],
    [FONT_STRONG]: [{ url: url(MAP_FONT_FILES.strong), "unicode-range": LATIN }, extended],
  };
}

export function buildMapStyle({ palette, origin, roadName, transitionMs = 360 }: MapStyleOptions): StyleSpecification {
  return {
    version: 8,
    name: "Parshwanath Champagne and Espresso",
    glyphs: GLYPHS_URL,
    "font-faces": mapFontFaces(origin),
    transition: { duration: transitionMs, delay: 0 },
    sources: {
      [SOURCE_ID]: { type: "vector", url: TILEJSON_URL },
      [FEATURE_SOURCE_ID]: { type: "geojson", data: featureRoad as GeoJSON.FeatureCollection },
      [FEATURE_LABEL_SOURCE_ID]: { type: "geojson", data: roadTagCollection() },
    },
    layers: [
      ...baseLayers(palette),
      ...transportLayers(palette),
      boundaryLayer(palette),
      ...featureLayers(palette),
      ...labelLayers(palette, roadName),
    ],
  };
}
