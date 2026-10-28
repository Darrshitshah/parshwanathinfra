// @vitest-environment jsdom
import { resetLiveMapCapability } from "./map-support";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationMap } from "@/components/home/LocationMap";
import { directionsUrl, formatCoordinates } from "@/components/ui/map-links";
import { homeCopy } from "@/content/copy/home";
import { shivShiva } from "@/content/projects";
import type { MapTokens } from "./map-style";

type Handler = () => void;

const mapState = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>;
    handlers: Record<string, Handler[]>;
    zoomIn: ReturnType<typeof vi.fn>;
    zoomOut: ReturnType<typeof vi.fn>;
    setStyle: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }>,
  markers: 0,
}));

vi.mock("maplibre-gl", () => {
  class FakeMap {
    options: Record<string, unknown>;
    handlers: Record<string, Handler[]> = {};
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    setStyle = vi.fn();
    remove = vi.fn();
    jumpTo = vi.fn();
    easeTo = vi.fn();
    touchZoomRotate = { disableRotation: vi.fn() };
    keyboard = { disableRotation: vi.fn() };
    constructor(options: Record<string, unknown>) {
      this.options = options;
      mapState.instances.push(this);
    }
    on(event: string, handler: Handler) {
      (this.handlers[event] ??= []).push(handler);
      return this;
    }
    once(event: string, handler: Handler) {
      return this.on(event, handler);
    }
    cameraForBounds() {
      return { zoom: 11.2 };
    }
  }
  class FakeMarker {
    constructor() {
      mapState.markers += 1;
    }
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  return { Map: FakeMap, Marker: FakeMarker, setWorkerUrl: vi.fn() };
});

const TOKENS: MapTokens = {
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

vi.mock("./map-runtime", () => ({
  readMapTokens: () => TOKENS,
  watchTheme: () => () => {},
  prefersReducedMotion: () => false,
}));

let observed: IntersectionObserverCallback | null = null;

function frame(container: HTMLElement) {
  return container.querySelector("[data-site-map]");
}

function emit(event: string) {
  const map = mapState.instances.at(-1);
  map?.handlers[event]?.forEach((handler) => handler());
}

async function scrollIntoRange() {
  await act(async () => {
    observed?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

function stubWebGl(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((kind: string) =>
    available && kind.startsWith("webgl") ? ({} as RenderingContext) : null) as HTMLCanvasElement["getContext"]);
}

beforeEach(() => {
  resetLiveMapCapability();
  observed = null;
  mapState.instances.length = 0;
  mapState.markers = 0;
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LocationMap before it is near the viewport", () => {
  it("shows a plain frame (never the schematic) and the card with the name, address, coordinates and both map links", () => {
    stubWebGl(true);
    const { container } = render(<LocationMap />);
    const location = shivShiva.location;
    expect(frame(container)?.getAttribute("data-state")).toBe("loading");
    expect(container.querySelector("svg[role='img']")).toBeNull();
    expect(frame(container)?.textContent).toContain(shivShiva.name);
    expect(frame(container)?.textContent).toContain(location.address);
    expect(frame(container)?.textContent).toContain(formatCoordinates(location.geo));
    expect(screen.getByRole("link", { name: /open in google maps/i })).toHaveAttribute("href", location.mapUrl);
    expect(screen.getByRole("link", { name: /get directions/i })).toHaveAttribute("href", directionsUrl(location.geo));
  });

  it("shows the schematic, labelled not to scale, only when the browser cannot draw the live map", () => {
    stubWebGl(false);
    const { container } = render(<LocationMap />);
    expect(container.textContent).toMatch(/not to scale/i);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
    expect(container.querySelector("figcaption")?.textContent).toBe(homeCopy.location.mapCaption);
    expect(mapState.instances).toHaveLength(0);
  });
});

describe("LocationMap near the viewport", () => {
  it("keeps the schematic when the browser has no WebGL", async () => {
    stubWebGl(false);
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    expect(mapState.instances).toHaveLength(0);
    expect(frame(container)?.getAttribute("data-state")).toBe("fallback");
  });

  it("keeps the schematic for visitors who asked to save data", async () => {
    stubWebGl(true);
    vi.stubGlobal("navigator", { ...navigator, connection: { saveData: true } });
    render(<LocationMap />);
    await scrollIntoRange();
    expect(mapState.instances).toHaveLength(0);
  });

  it("builds the map on the content's coordinates with cooperative gestures and no default controls", async () => {
    stubWebGl(true);
    render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapState.instances).toHaveLength(1));
    const { options } = mapState.instances[0];
    expect(options.center).toEqual([shivShiva.location.geo.lng, shivShiva.location.geo.lat]);
    expect(options.cooperativeGestures).toBe(true);
    expect(options.attributionControl).toBe(false);
    expect(options.dragRotate).toBe(false);
    expect(mapState.markers).toBe(1);
    const style = options.style as { sources: Record<string, { url?: string }> };
    expect(style.sources.openmaptiles.url).toBe("https://tiles.openfreemap.org/planet");
  });

  it("goes live on the first complete render: our controls and the live caption, no credit pill on the map", async () => {
    stubWebGl(true);
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapState.instances).toHaveLength(1));
    await act(async () => emit("load"));

    const zoomIn = await screen.findByRole("button", { name: /zoom in/i });
    expect(frame(container)?.getAttribute("data-state")).toBe("live");
    expect(screen.getByRole("region", { name: /street map/i })).toBeInTheDocument();
    expect(container.querySelector("svg[role='img']")).toBeNull();
    expect(container.querySelector("figcaption")?.textContent).toBe(homeCopy.location.liveCaption);
    expect(container.querySelector("figcaption")?.textContent).toMatch(/openstreetmap/i);
    expect(screen.queryByRole("link", { name: /openfreemap/i })).toBeNull();
    expect(screen.getByRole("link", { name: /open in google maps/i })).toBeInTheDocument();

    fireEvent.click(zoomIn);
    expect(mapState.instances[0].zoomIn).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
    expect(mapState.instances[0].zoomOut).toHaveBeenCalled();
  });

  it("falls back to the schematic on an error before the first render", async () => {
    stubWebGl(true);
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapState.instances).toHaveLength(1));
    await act(async () => emit("error"));
    await waitFor(() => expect(mapState.instances[0].remove).toHaveBeenCalled());
    expect(frame(container)?.getAttribute("data-state")).toBe("fallback");
    expect(screen.queryByRole("button", { name: /zoom in/i })).toBeNull();
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });

  it("hands back to the schematic if the WebGL context is lost after going live", async () => {
    stubWebGl(true);
    const { container } = render(<LocationMap />);
    await scrollIntoRange();
    await waitFor(() => expect(mapState.instances).toHaveLength(1));
    await act(async () => emit("load"));
    await screen.findByRole("button", { name: /zoom in/i });
    await act(async () => emit("webglcontextlost"));
    await waitFor(() => expect(frame(container)?.getAttribute("data-state")).toBe("fallback"));
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
