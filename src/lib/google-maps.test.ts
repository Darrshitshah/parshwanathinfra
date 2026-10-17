// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shivShiva } from "@/content/projects";
import {
  CALLBACK_NAME,
  DEFAULT_ZOOM,
  DEMO_MAP_ID,
  LOAD_TIMEOUT_MS,
  buildMapOptions,
  buildMapsScriptUrl,
  getMapId,
  getMapsApiKey,
  loadGoogleMaps,
  onMapsAuthFailure,
  resetGoogleMapsLoader,
} from "./google-maps";

type TestWindow = Window & { google?: unknown; [CALLBACK_NAME]?: () => void; gm_authFailure?: () => void };
const testWindow = window as TestWindow;

class FakeMap {}
class FakeMarker {}

function installFakeApi() {
  testWindow.google = {
    maps: { importLibrary: async (name: string) => (name === "maps" ? { Map: FakeMap } : { AdvancedMarkerElement: FakeMarker }) },
  };
}

function mapsScripts(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com"]')];
}

beforeEach(() => {
  resetGoogleMapsLoader();
});

afterEach(() => {
  mapsScripts().forEach((script) => script.remove());
  delete testWindow.google;
  delete testWindow[CALLBACK_NAME];
  delete testWindow.gm_authFailure;
  vi.useRealTimers();
});

describe("getMapsApiKey / getMapId", () => {
  it("returns null when the key is missing or blank, so the page renders the static fallback", () => {
    expect(getMapsApiKey(undefined)).toBeNull();
    expect(getMapsApiKey("")).toBeNull();
    expect(getMapsApiKey("   ")).toBeNull();
  });

  it("returns the trimmed key when one is set", () => {
    expect(getMapsApiKey("  abc123 ")).toBe("abc123");
  });

  it("falls back to Google's demo Map ID unless one is configured", () => {
    expect(getMapId(undefined)).toBe(DEMO_MAP_ID);
    expect(getMapId(" ")).toBe(DEMO_MAP_ID);
    expect(getMapId("my-map-id")).toBe("my-map-id");
  });
});

describe("buildMapsScriptUrl", () => {
  it("uses the documented async bootstrap with a callback and encodes the key", () => {
    const url = new URL(buildMapsScriptUrl("a b&c"));
    expect(url.origin + url.pathname).toBe("https://maps.googleapis.com/maps/api/js");
    expect(url.searchParams.get("key")).toBe("a b&c");
    expect(url.searchParams.get("loading")).toBe("async");
    expect(url.searchParams.get("callback")).toBe(CALLBACK_NAME);
  });
});

describe("buildMapOptions", () => {
  it("centres on the coordinates from the content, never on literals in a component", () => {
    const options = buildMapOptions(shivShiva.location.geo, DEMO_MAP_ID);
    expect(options.center).toEqual({ lat: 20.2934524, lng: 72.9932563 });
    expect(options.center).toEqual(shivShiva.location.geo);
    expect(options.zoom).toBe(DEFAULT_ZOOM);
  });

  it("is a hybrid satellite map with Google's default UI off and cooperative gestures", () => {
    const options = buildMapOptions(shivShiva.location.geo, "id", "#123456");
    expect(options.mapTypeId).toBe("hybrid");
    expect(options.disableDefaultUI).toBe(true);
    expect(options.gestureHandling).toBe("cooperative");
    expect(options.mapId).toBe("id");
    expect(options.backgroundColor).toBe("#123456");
    expect(buildMapOptions(shivShiva.location.geo, "id")).not.toHaveProperty("backgroundColor");
  });
});

describe("loadGoogleMaps", () => {
  it("adds nothing to the page until it is called, then injects one async script with the key", () => {
    expect(mapsScripts()).toHaveLength(0);
    void loadGoogleMaps("test-key");
    const scripts = mapsScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);
    expect(new URL(scripts[0].src).searchParams.get("key")).toBe("test-key");
  });

  it("resolves with the Map and AdvancedMarkerElement classes once Google calls back, and loads only once", async () => {
    const first = loadGoogleMaps("test-key");
    const second = loadGoogleMaps("test-key");
    expect(second).toBe(first);
    expect(mapsScripts()).toHaveLength(1);
    installFakeApi();
    testWindow[CALLBACK_NAME]?.();
    const api = await first;
    expect(api.Map).toBe(FakeMap);
    expect(api.AdvancedMarkerElement).toBe(FakeMarker);
  });

  it("reuses an API that is already on the page without adding a script", async () => {
    installFakeApi();
    const api = await loadGoogleMaps("test-key");
    expect(api.Map).toBe(FakeMap);
    expect(mapsScripts()).toHaveLength(0);
  });

  it("rejects, removes the script and allows a retry when the script fails to load", async () => {
    const attempt = loadGoogleMaps("test-key");
    mapsScripts()[0].onerror?.(new Event("error"));
    await expect(attempt).rejects.toThrow(/failed to load/i);
    expect(mapsScripts()).toHaveLength(0);
    void loadGoogleMaps("test-key");
    expect(mapsScripts()).toHaveLength(1);
  });

  it("rejects when the API never calls back", async () => {
    vi.useFakeTimers();
    const attempt = loadGoogleMaps("test-key");
    const assertion = expect(attempt).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS + 1);
    await assertion;
  });
});

describe("onMapsAuthFailure", () => {
  it("tells the listener when Google reports a bad key or a denied referrer, and unsubscribes cleanly", () => {
    const listener = vi.fn();
    const stop = onMapsAuthFailure(listener);
    testWindow.gm_authFailure?.();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    expect(testWindow.gm_authFailure).toBeUndefined();
  });
});
