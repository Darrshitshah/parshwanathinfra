// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationMap } from "@/components/home/LocationMap";
import { directionsUrl, formatCoordinates } from "@/components/ui/map-links";
import { shivShiva } from "@/content/projects";
import { CALLBACK_NAME, resetGoogleMapsLoader, type GoogleMapOptions } from "@/lib/google-maps";

type TestWindow = Window & { google?: unknown; [CALLBACK_NAME]?: () => void };
const testWindow = window as TestWindow;
const KEY_ENV = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";

function mapsScripts(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com"]')];
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mapsScripts().forEach((script) => script.remove());
  delete testWindow.google;
  delete testWindow[CALLBACK_NAME];
  resetGoogleMapsLoader();
});

describe("LocationMap without an API key", () => {
  beforeEach(() => {
    vi.stubEnv(KEY_ENV, "");
  });

  it("renders the static card with the name, address, coordinates and both map links, all from the content", () => {
    const { container } = render(<LocationMap />);
    const location = shivShiva.location;
    const frame = container.querySelector("[data-site-map]");
    expect(frame?.getAttribute("data-state")).toBe("fallback");
    expect(frame?.textContent).toContain(shivShiva.name);
    expect(frame?.textContent).toContain(location.address);
    expect(frame?.textContent).toContain(formatCoordinates(location.geo));
    expect(screen.getByRole("link", { name: /open in google maps/i })).toHaveAttribute("href", location.mapUrl);
    expect(screen.getByRole("link", { name: /get directions/i })).toHaveAttribute("href", directionsUrl(location.geo));
  });

  it("keeps the schematic labelled as not to scale and never touches Google", () => {
    const { container } = render(<LocationMap />);
    expect(container.textContent).toMatch(/not to scale/i);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
    expect(mapsScripts()).toHaveLength(0);
  });
});

describe("LocationMap with an API key", () => {
  let observed: IntersectionObserverCallback | null = null;
  let mapOptions: GoogleMapOptions | null = null;
  const setZoom = vi.fn();

  class FakeMap {
    constructor(_element: HTMLElement, options: GoogleMapOptions) {
      mapOptions = options;
    }
    addListener(_event: string, handler: () => void) {
      queueMicrotask(handler);
      return { remove: vi.fn() };
    }
    getZoom() {
      return 16;
    }
    setZoom = setZoom;
    setCenter = vi.fn();
    panTo = vi.fn();
  }
  class FakeMarker {
    map: unknown = null;
  }

  beforeEach(() => {
    vi.stubEnv(KEY_ENV, "test-key");
    observed = null;
    mapOptions = null;
    setZoom.mockClear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observed = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  async function scrollIntoRange() {
    await act(async () => {
      observed?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  }

  it("does not load Google Maps until the section is near the viewport", () => {
    const { container } = render(<LocationMap />);
    expect(mapsScripts()).toHaveLength(0);
    expect(container.querySelector("[data-site-map]")?.getAttribute("data-state")).toBe("fallback");
    expect(container.textContent).toContain(shivShiva.location.address);
  });

  it("loads the API when near, centres the map on the content's coordinates and shows our controls", async () => {
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapsScripts()).toHaveLength(1));
    expect(new URL(mapsScripts()[0].src).searchParams.get("key")).toBe("test-key");

    testWindow.google = {
      maps: { importLibrary: async (name: string) => (name === "maps" ? { Map: FakeMap } : { AdvancedMarkerElement: FakeMarker }) },
    };
    await act(async () => {
      testWindow[CALLBACK_NAME]?.();
    });

    const zoomIn = await screen.findByRole("button", { name: /zoom in/i });
    expect(mapOptions?.center).toEqual(shivShiva.location.geo);
    expect(container.querySelector("[data-site-map]")?.getAttribute("data-state")).toBe("live");
    expect(screen.getByRole("region", { name: /satellite map/i })).toBeInTheDocument();
    expect(container.querySelector("svg[role='img']")).toBeNull();
    expect(screen.getByRole("link", { name: /open in google maps/i })).toBeInTheDocument();

    fireEvent.click(zoomIn);
    expect(setZoom).toHaveBeenCalledWith(17);
  });

  it("keeps the static card when the script fails to load", async () => {
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapsScripts()).toHaveLength(1));
    await act(async () => {
      mapsScripts()[0].onerror?.(new Event("error"));
    });
    await waitFor(() => expect(container.querySelector("[data-site-map]")?.getAttribute("data-state")).toBe("fallback"));
    expect(screen.queryByRole("button", { name: /zoom in/i })).toBeNull();
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
    expect(screen.getByRole("link", { name: /get directions/i })).toBeInTheDocument();
  });
});
