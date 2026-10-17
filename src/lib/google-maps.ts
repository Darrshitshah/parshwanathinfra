/**
 * Google Maps JavaScript API: a small on-demand loader and the map options, with no npm package.
 *
 * The API is loaded with the documented bootstrap URL (`loading=async` plus a `callback`) the first time a map is
 * needed, never at page load. Nothing in this file touches the network until `loadGoogleMaps` is called, and that is
 * only called from the lazily imported map canvas once the location section is near the viewport.
 *
 * The key is public by design (it ships in the browser); it is protected by HTTP referrer and API restrictions in
 * Google Cloud, see `.env.example`. Without a key, `getMapsApiKey()` returns null and the page shows the static fallback.
 *
 * Minimal types are declared here instead of installing `@types/google.maps`.
 */

export const MAPS_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
export const CALLBACK_NAME = "__parshwanathMapsReady";

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleMapOptions {
  center: LatLngLiteral;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  mapTypeId: "satellite" | "hybrid";
  mapId: string;
  disableDefaultUI: boolean;
  gestureHandling: "cooperative" | "greedy" | "none" | "auto";
  clickableIcons: boolean;
  keyboardShortcuts: boolean;
  tilt: number;
  backgroundColor?: string;
}

export interface GoogleMapInstance {
  setCenter(center: LatLngLiteral): void;
  panTo(center: LatLngLiteral): void;
  getZoom(): number | undefined;
  setZoom(zoom: number): void;
  addListener(event: string, handler: () => void): { remove(): void };
}

export interface GoogleMarkerOptions {
  map: GoogleMapInstance;
  position: LatLngLiteral;
  content: HTMLElement;
  title: string;
}

export interface GoogleMarkerInstance {
  map: GoogleMapInstance | null;
}

export interface GoogleMapsApi {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
  AdvancedMarkerElement: new (options: GoogleMarkerOptions) => GoogleMarkerInstance;
}

interface MapsLibraries {
  maps: { Map: GoogleMapsApi["Map"] };
  marker: { AdvancedMarkerElement: GoogleMapsApi["AdvancedMarkerElement"] };
}

interface MapsWindow extends Window {
  google?: { maps?: { importLibrary?: <K extends keyof MapsLibraries>(name: K) => Promise<MapsLibraries[K]> } };
  gm_authFailure?: () => void;
  [CALLBACK_NAME]?: () => void;
}

export const LOAD_TIMEOUT_MS = 15_000;
/** Google's documented demo Map ID: lets Advanced Markers work before a real Map ID exists. */
export const DEMO_MAP_ID = "DEMO_MAP_ID";

/** Overview of the township and the road around it. */
export const DEFAULT_ZOOM = 16;
const MIN_ZOOM = 6;
const MAX_ZOOM = 20;

/** The public key, or null when it is missing or blank (the page then renders the static fallback). */
export function getMapsApiKey(raw: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY): string | null {
  const key = raw?.trim();
  return key ? key : null;
}

/** The Map ID for Advanced Markers: the configured one, else Google's demo ID. */
export function getMapId(raw: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID): string {
  const id = raw?.trim();
  return id ? id : DEMO_MAP_ID;
}

/** The documented bootstrap URL for `loading=async` with a callback. */
export function buildMapsScriptUrl(key: string, callback: string = CALLBACK_NAME): string {
  const params = new URLSearchParams({ key, loading: "async", callback, v: "weekly" });
  return `${MAPS_SCRIPT_URL}?${params.toString()}`;
}

/**
 * Map options for the site: hybrid satellite (road and place names stay readable over the imagery), centred on the pin
 * from the content, Google's default controls off (the page draws its own), and cooperative gestures so touch
 * scrolling and the wheel keep scrolling the page.
 */
export function buildMapOptions(center: LatLngLiteral, mapId: string, backgroundColor?: string): GoogleMapOptions {
  return {
    center,
    zoom: DEFAULT_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    mapTypeId: "hybrid",
    mapId,
    disableDefaultUI: true,
    gestureHandling: "cooperative",
    clickableIcons: false,
    keyboardShortcuts: true,
    tilt: 0,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

let pending: Promise<GoogleMapsApi> | null = null;

async function importLibraries(win: MapsWindow): Promise<GoogleMapsApi> {
  const importLibrary = win.google?.maps?.importLibrary;
  if (!importLibrary) throw new Error("Google Maps did not initialise");
  const [maps, marker] = await Promise.all([importLibrary("maps"), importLibrary("marker")]);
  return { Map: maps.Map, AdvancedMarkerElement: marker.AdvancedMarkerElement };
}

/** Loads the API once per page and resolves with the two classes the map needs. Rejects on network or key failure. */
export function loadGoogleMaps(key: string, doc: Document = document): Promise<GoogleMapsApi> {
  if (pending) return pending;
  const win = doc.defaultView as MapsWindow;
  const attempt = new Promise<GoogleMapsApi>((resolve, reject) => {
    if (win.google?.maps?.importLibrary) {
      importLibraries(win).then(resolve, reject);
      return;
    }
    const script = doc.createElement("script");
    const timer = win.setTimeout(() => fail(new Error("Google Maps timed out")), LOAD_TIMEOUT_MS);
    function cleanup() {
      win.clearTimeout(timer);
      delete win[CALLBACK_NAME];
    }
    function fail(error: Error) {
      cleanup();
      script.remove();
      pending = null;
      reject(error);
    }
    win[CALLBACK_NAME] = () => {
      cleanup();
      importLibraries(win).then(resolve, (error: unknown) => {
        pending = null;
        reject(error instanceof Error ? error : new Error("Google Maps failed to load"));
      });
    };
    script.src = buildMapsScriptUrl(key);
    script.async = true;
    script.onerror = () => fail(new Error("Google Maps script failed to load"));
    doc.head.append(script);
  });
  pending = attempt;
  return attempt;
}

/** Subscribes to Google's invalid-key / referrer-denied signal (`gm_authFailure`). Returns an unsubscribe. */
export function onMapsAuthFailure(listener: () => void, win: Window = window): () => void {
  const target = win as MapsWindow;
  const previous = target.gm_authFailure;
  const handler = () => {
    previous?.();
    listener();
  };
  target.gm_authFailure = handler;
  return () => {
    if (target.gm_authFailure === handler) target.gm_authFailure = previous;
  };
}

/** Test helper: forget a finished or failed load. */
export function resetGoogleMapsLoader(): void {
  pending = null;
}
