"use client";

/**
 * The live street map, imported lazily by SiteMap once the section nears the viewport (MapLibre and its CSS live only
 * in this chunk). OpenFreeMap vector tiles drawn with our own style (map-style.ts) from the site's tokens, re-drawn
 * live when the theme toggles; a gold Shiv Shiva pin; our glass zoom and recenter controls; cooperative gestures so the
 * page always scrolls; and the OpenStreetMap / OpenMapTiles / OpenFreeMap credit in our type. Reports "ready" on the
 * first complete render and "failed" on a style or tile error, a lost WebGL context or a timeout, so the schematic
 * fallback can take over. Owner: pages-lead.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAX_ZOOM, MIN_ZOOM, clampOpeningZoom, contextBounds, panBounds, type LngLat } from "./map-camera";
import { readMapTokens, prefersReducedMotion, watchTheme } from "./map-runtime";
import { buildMapStyle, paletteFromTokens, type MapTokens } from "./map-style";
import type { MapAttribution, SiteMapLabels } from "./SiteMap";
import "./site-map.css";

// MapLibre 6 starts its worker from a separate, self-contained file; the bundler emits it as a hashed static asset.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

/** Give up and keep the schematic if the first complete render has not happened by then. */
export const MAP_TIMEOUT_MS = 15_000;
const FRAME_PADDING = 24;

interface SiteMapCanvasProps {
  geo: LngLat;
  title: string;
  roadName: string;
  labels: SiteMapLabels;
  attribution: readonly MapAttribution[];
  onReady: () => void;
  onFail: () => void;
}

function createPin(title: string): HTMLElement {
  const pin = document.createElement("div");
  pin.className = "site-pin";
  pin.setAttribute("aria-hidden", "true");
  const halo = document.createElement("span");
  halo.className = "site-pin__halo";
  const dot = document.createElement("span");
  dot.className = "site-pin__dot";
  const label = document.createElement("span");
  label.className = "site-pin__label glass";
  label.textContent = title;
  pin.append(halo, dot, label);
  return pin;
}

function styleFor(tokens: MapTokens, roadName: string) {
  return buildMapStyle({
    palette: paletteFromTokens(tokens),
    origin: window.location.origin,
    roadName,
    transitionMs: prefersReducedMotion() ? 0 : 360,
  });
}

function openingZoom(map: MapLibreMap, geo: LngLat): number {
  const camera = map.cameraForBounds(contextBounds(geo), { padding: FRAME_PADDING });
  return clampOpeningZoom(camera?.zoom);
}

const CONTROL_PATHS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  recenter: "M12 3v4M12 17v4M3 12h4M17 12h4",
} as const;

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="glass grid size-11 place-items-center rounded-full text-ink transition-transform duration-(--duration-quick) hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      {children}
    </button>
  );
}

function ControlIcon({ name }: { name: keyof typeof CONTROL_PATHS }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d={CONTROL_PATHS[name]} />
      {name === "recenter" ? <circle cx="12" cy="12" r="4.25" /> : null}
    </svg>
  );
}

export function SiteMapCanvas({ geo, title, roadName, labels, attribution, onReady, onFail }: SiteMapCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const homeZoomRef = useRef<number>(clampOpeningZoom(undefined));
  const [ready, setReady] = useState(false);
  const { lat, lng } = geo;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const site = { lat, lng };
    const tokens = readMapTokens(document.body);
    if (!tokens) {
      onFail();
      return;
    }

    let loaded = false;
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      onFail();
    };

    const options: MapOptions = {
      container: host,
      style: styleFor(tokens, roadName),
      center: [lng, lat],
      zoom: clampOpeningZoom(undefined),
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: panBounds(site),
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      cooperativeGestures: true,
      attributionControl: false,
      renderWorldCopies: false,
      fadeDuration: prefersReducedMotion() ? 0 : 240,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": labels.gestures.windows,
        "CooperativeGesturesHandler.MacHelpText": labels.gestures.mac,
        "CooperativeGesturesHandler.MobileHelpText": labels.gestures.mobile,
      },
    };

    let map: MapLibreMap;
    try {
      map = new MapLibreMap(options);
    } catch {
      fail();
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    const marker = new Marker({ element: createPin(title), anchor: "center" }).setLngLat([lng, lat]).addTo(map);
    const timer = window.setTimeout(() => {
      if (!loaded) fail();
    }, MAP_TIMEOUT_MS);

    map.once("load", () => {
      if (failed) return;
      loaded = true;
      window.clearTimeout(timer);
      // Fit the Vapi to Silvassa context now that the frame is measured; the map is still invisible, so no jump shows.
      homeZoomRef.current = openingZoom(map, site);
      map.jumpTo({ center: [lng, lat], zoom: homeZoomRef.current });
      setReady(true);
      onReady();
    });
    // Before the first render any error (style, TileJSON, tiles, fonts) means the schematic stays; after it, a single
    // missing tile is not worth tearing the map down for. A lost WebGL context always hands back to the schematic.
    map.on("error", () => {
      if (!loaded) fail();
    });
    map.on("webglcontextlost", fail);

    let lastTokens = JSON.stringify(tokens);
    const stopWatching = watchTheme(() => {
      const next = readMapTokens(document.body);
      if (!next || JSON.stringify(next) === lastTokens) return;
      lastTokens = JSON.stringify(next);
      map.setStyle(styleFor(next, roadName));
    });

    return () => {
      window.clearTimeout(timer);
      stopWatching();
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, title, roadName, labels.gestures.windows, labels.gestures.mac, labels.gestures.mobile, onReady, onFail]);

  function zoomBy(step: number) {
    const map = mapRef.current;
    if (!map) return;
    if (step > 0) map.zoomIn({ animate: !prefersReducedMotion() });
    else map.zoomOut({ animate: !prefersReducedMotion() });
  }

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    homeZoomRef.current = openingZoom(map, { lat, lng });
    const camera = { center: [lng, lat] as [number, number], zoom: homeZoomRef.current };
    if (prefersReducedMotion()) map.jumpTo(camera);
    else map.easeTo({ ...camera, duration: 700 });
  }

  return (
    <>
      <div
        className={`absolute inset-0 isolate transition-opacity duration-(--duration-slow) motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      >
        {/* MapLibre makes its container position: relative, so the container fills a positioned wrapper. */}
        <div ref={hostRef} role="region" aria-label={labels.region} className="site-map size-full" />
      </div>
      {ready ? (
        <>
          <div role="group" aria-label={labels.controls} className="absolute right-3 top-3 z-[2] flex flex-col gap-2">
            <ControlButton label={labels.zoomIn} onClick={() => zoomBy(1)}>
              <ControlIcon name="plus" />
            </ControlButton>
            <ControlButton label={labels.zoomOut} onClick={() => zoomBy(-1)}>
              <ControlIcon name="minus" />
            </ControlButton>
            <ControlButton label={labels.recenter} onClick={recenter}>
              <ControlIcon name="recenter" />
            </ControlButton>
          </div>
          <p className="site-map__credit glass absolute bottom-2 right-2 z-[2] m-0 rounded-full px-2.5 py-1 text-ink-muted" data-map-attribution>
            {attribution.map((item, index) => (
              <span key={item.href}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              </span>
            ))}
          </p>
        </>
      ) : null}
    </>
  );
}
