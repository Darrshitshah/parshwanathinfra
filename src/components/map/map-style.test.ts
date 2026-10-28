import { describe, expect, it } from "vitest";
import { clampOpeningZoom, contextBounds, DEFAULT_ZOOM, OPENING_ZOOM, panBounds, PAN_FENCE } from "./map-camera";
import { luminance, mix, parseColour, toHex, withAlpha } from "./map-colour";
import { buildMapStyle, FEATURE_SOURCE_ID, GLYPHS_URL, MAP_FONT_FILES, paletteFromTokens, roadTag, TILEJSON_URL, type MapTokens } from "./map-style";
import road from "./vapi-silvassa-road.json";

const LIGHT: MapTokens = {
  paper: "#f6efe2",
  paperRaised: "#fcf8f0",
  paperSunk: "#ece3d2",
  ink: "#231a12",
  inkMuted: "#5e5144",
  sand: "#dccaa3",
  brick: "#a58039",
  brickInk: "#7a5518",
  forest: "#4d6a48",
  water: "#235a85",
};

const DARK: MapTokens = {
  paper: "#120e0a",
  paperRaised: "#1d1711",
  paperSunk: "#0b0806",
  ink: "#f3e9d6",
  inkMuted: "#bfb09a",
  sand: "#cdb88f",
  brick: "#d9b263",
  brickInk: "#ebcf8f",
  forest: "#93c49c",
  water: "#b0d4f2",
};

const ORIGIN = "https://parshwanath.example";

describe("map colour maths", () => {
  it("reads hex and rgb colours and rejects anything else", () => {
    expect(parseColour("#abc")).toEqual([170, 187, 204]);
    expect(parseColour(" #A58039 ")).toEqual([165, 128, 57]);
    expect(parseColour("rgb(35 26 18 / 0.5)")).toEqual([35, 26, 18]);
    expect(parseColour("rgba(300, 2, 18.6, 1)")).toEqual([255, 2, 19]);
    expect(parseColour("color-mix(in srgb, red, blue)")).toBeNull();
  });

  it("mixes like color-mix in srgb", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#a58039", "#231a12", 0)).toBe("#a58039");
    expect(mix("#a58039", "#231a12", 2)).toBe("#231a12");
    expect(mix("nope", "#ffffff", 0.5)).toBe("nope");
    expect(toHex([1, 2, 3])).toBe("#010203");
  });

  it("adds alpha and measures luminance", () => {
    expect(withAlpha("#a58039", 0.3)).toBe("rgba(165, 128, 57, 0.3)");
    expect(withAlpha("nope", 0.3)).toBe("nope");
    expect(luminance("#ffffff")).toBeCloseTo(1);
    expect(luminance("#000000")).toBeCloseTo(0);
    expect(luminance(LIGHT.paper)).toBeGreaterThan(luminance(DARK.paper));
  });
});

describe("palette from the site tokens", () => {
  it("knows day from night by the paper colour", () => {
    expect(paletteFromTokens(LIGHT).dark).toBe(false);
    expect(paletteFromTokens(DARK).dark).toBe(true);
  });

  it("keeps the road gold, the labels in ink and the land in the paper family", () => {
    for (const tokens of [LIGHT, DARK]) {
      const palette = paletteFromTokens(tokens);
      expect(palette.feature).toBe(tokens.brick);
      expect(palette.label).toBe(tokens.ink);
      expect(palette.halo).toBe(palette.land);
      expect(Math.abs(luminance(palette.land) - luminance(tokens.paper))).toBeLessThan(0.08);
    }
  });

  it("gives labels real contrast against the land in both themes", () => {
    for (const tokens of [LIGHT, DARK]) {
      const palette = paletteFromTokens(tokens);
      const [a, b] = [luminance(palette.label), luminance(palette.land)].sort((x, y) => y - x);
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThan(7);
    }
  });
});

describe("map style", () => {
  const style = buildMapStyle({ palette: paletteFromTokens(LIGHT), origin: ORIGIN, roadName: "Vapi-Silvassa Road" });
  const layers = style.layers;
  const layoutOf = (id: string) => (layers.find((layer) => layer.id === id)?.layout ?? {}) as Record<string, unknown>;

  it("draws OpenFreeMap's OpenMapTiles source and the gold road trace, with no sprite", () => {
    expect(style.sources.openmaptiles).toEqual({ type: "vector", url: TILEJSON_URL });
    expect(style.sources[FEATURE_SOURCE_ID]).toMatchObject({ type: "geojson" });
    expect(style.glyphs).toBe(GLYPHS_URL);
    expect(style.sprite).toBeUndefined();
  });

  it("sets every label in the site's sans from absolute font URLs", () => {
    const faces = style["font-faces"] as Record<string, Array<{ url: string }>>;
    const urls = Object.values(faces).flat().map((face) => face.url);
    expect(urls).toContain(`${ORIGIN}${MAP_FONT_FILES.regular}`);
    expect(urls).toContain(`${ORIGIN}${MAP_FONT_FILES.strong}`);
    const symbolFonts = layers.filter((layer) => layer.type === "symbol").flatMap((layer) => (layoutOf(layer.id)["text-font"] as string[]) ?? []);
    expect(symbolFonts.length).toBeGreaterThan(0);
    for (const font of symbolFonts) expect(Object.keys(faces)).toContain(font);
  });

  it("only uses colours from the palette", () => {
    const palette = paletteFromTokens(LIGHT);
    const allowed = new Set(Object.values(palette).filter((value) => typeof value === "string"));
    const colours = layers.flatMap((layer) =>
      Object.entries(layer.paint ?? {})
        .filter(([key]) => key.endsWith("-color"))
        .map(([, value]) => value),
    );
    expect(colours.length).toBeGreaterThan(10);
    for (const colour of colours) expect(allowed).toContain(colour);
  });

  it("draws the gold road above the other roads and labels it with the content's road name", () => {
    const ids = layers.map((layer) => layer.id);
    expect(ids.indexOf("feature-road")).toBeGreaterThan(ids.indexOf("road-trunk"));
    expect(layoutOf("label-feature-road-tag")["text-field"]).toBe("VAPI-SILVASSA ROAD");
    expect(layoutOf("label-feature-road")["symbol-placement"]).toBe("line");
  });

  it("transitions theme changes unless motion is reduced", () => {
    expect(style.transition?.duration).toBe(360);
    const still = buildMapStyle({ palette: paletteFromTokens(DARK), origin: ORIGIN, roadName: "x", transitionMs: 0 });
    expect(still.transition?.duration).toBe(0);
  });
});

describe("road trace and tag", () => {
  const coordinates = road.features[0].geometry.coordinates as [number, number][];

  it("runs from Vapi (north-west) to Silvassa (south-east) past the site", () => {
    expect(coordinates.length).toBeGreaterThan(20);
    const [first, last] = [coordinates[0], coordinates.at(-1)!];
    expect(first[1]).toBeGreaterThan(last[1]);
    expect(first[0]).toBeLessThan(last[0]);
  });

  it("tilts the tag along a road that falls to the south-east", () => {
    const tag = roadTag([[72.9, 20.4], [72.95, 20.35], [73.0, 20.3]], 0.5, 1);
    expect(tag.point).toEqual([72.95, 20.35]);
    expect(tag.rotate).toBeGreaterThan(40);
    expect(tag.rotate).toBeLessThan(50);
    expect(roadTag([[73.0, 20.3], [72.9, 20.4]], 0.5, 1).rotate).toBeGreaterThan(40);
  });
});

describe("camera", () => {
  const site = { lat: 20.2934524, lng: 72.9932563 };

  it("frames a box centred on the site and fences panning around it", () => {
    const [[west, south], [east, north]] = contextBounds(site);
    expect((west + east) / 2).toBeCloseTo(site.lng);
    expect((south + north) / 2).toBeCloseTo(site.lat);
    const fence = panBounds(site);
    expect(fence[1][0] - fence[0][0]).toBeCloseTo(PAN_FENCE * 2);
  });

  it("keeps the opening zoom in its band", () => {
    expect(clampOpeningZoom(undefined)).toBe(DEFAULT_ZOOM);
    expect(clampOpeningZoom(Number.NaN)).toBe(DEFAULT_ZOOM);
    expect(clampOpeningZoom(3)).toBe(OPENING_ZOOM.min);
    expect(clampOpeningZoom(18)).toBe(OPENING_ZOOM.max);
    expect(clampOpeningZoom(11)).toBe(11);
  });
});
