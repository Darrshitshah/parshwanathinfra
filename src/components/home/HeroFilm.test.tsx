// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { heroFilm } from "@/content/hero-film";
import { SERVER_DEVICE, type DeviceInfo } from "@/lib/device-tier";
import { HeroFilm } from "./HeroFilm";

let device: DeviceInfo = SERVER_DEVICE;
vi.mock("@/lib/device-tier-provider", () => ({ useDeviceTier: () => device }));

const A: DeviceInfo = { ...SERVER_DEVICE, tier: "A", ready: true, finePointer: true };

let narrow = false;
let observerCallback: IntersectionObserverCallback | null = null;
const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();

beforeEach(() => {
  narrow = false;
  observerCallback = null;
  play.mockClear();
  pause.mockClear();
  Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
  window.requestIdleCallback = ((cb: IdleRequestCallback) => {
    cb({ didTimeout: false, timeRemaining: () => 50 });
    return 1;
  }) as typeof window.requestIdleCallback;
  window.cancelIdleCallback = vi.fn();
  window.matchMedia = ((query: string) => ({ matches: narrow && query.includes("max-width"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class {
    constructor(cb: IntersectionObserverCallback) {
      observerCallback = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
  HTMLMediaElement.prototype.play = play as unknown as () => Promise<void>;
  HTMLMediaElement.prototype.pause = pause;
});

afterEach(() => {
  cleanup();
  device = SERVER_DEVICE;
});

function setVisible(isIntersecting: boolean) {
  act(() => observerCallback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}

describe("HeroFilm poster", () => {
  it("is an image first: the LCP img with alt, hooks, high priority and the start frame, no video", () => {
    const { container } = render(<HeroFilm film={heroFilm} />);
    const img = container.querySelector("img[data-hero-image]");
    expect(img?.getAttribute("alt")).toBe(heroFilm.alt);
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img?.getAttribute("loading")).toBe("eager");
    expect(img?.getAttribute("src")).toBe(heroFilm.posters.start.webp);
    expect(img?.closest("[data-hero-poster]")).not.toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });

  it("serves avif then webp, and the final frame to prefers-reduced-motion before any script runs", () => {
    const { container } = render(<HeroFilm film={heroFilm} />);
    const sources = Array.from(container.querySelectorAll("source")).map((s) => [s.getAttribute("media"), s.getAttribute("type"), s.getAttribute("srcset")]);
    expect(sources).toEqual([
      ["(prefers-reduced-motion: reduce)", "image/avif", heroFilm.posters.final.avif],
      ["(prefers-reduced-motion: reduce)", "image/webp", heroFilm.posters.final.webp],
      [null, "image/avif", heroFilm.posters.start.avif],
      [null, "image/webp", heroFilm.posters.start.webp],
    ]);
  });

  it("keeps the Artist's impression label visible", () => {
    const { getByText } = render(<HeroFilm film={heroFilm} />);
    expect(getByText("Artist's impression")).toBeInTheDocument();
  });

  it.each([
    ["reduced motion", { ...A, tier: "C" as const, reducedMotion: true }],
    ["Save-Data", { ...A, tier: "C" as const, saveData: true }],
    ["Tier C", { ...A, tier: "C" as const }],
  ])("shows the final poster only, no video and no control, for %s", (_name, info) => {
    device = info;
    const { container, queryByRole, getByText } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[data-hero-image]")?.getAttribute("src")).toBe(heroFilm.posters.final.webp);
    expect(queryByRole("button")).toBeNull();
    expect(getByText("Artist's impression")).toBeInTheDocument();
  });
});

describe("HeroFilm playback", () => {
  it("does not create the video until the hero has been seen", () => {
    device = A;
    const { container } = render(<HeroFilm film={heroFilm} />);
    expect(container.querySelector("video")).toBeNull();
    setVisible(true);
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("is decorative and silent: aria-hidden, muted, inline, no controls, webm then mp4 (full cut on desktop)", () => {
    device = A;
    const { container } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.muted).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(video.hasAttribute("controls")).toBe(false);
    expect(video.hasAttribute("loop")).toBe(false);
    expect(Array.from(video.querySelectorAll("source")).map((s) => s.getAttribute("src"))).toEqual(["/video/hero/hero-desktop.webm", "/video/hero/hero-desktop.mp4"]);
    expect(play).toHaveBeenCalled();
  });

  it("uses the short mobile encodes on a narrow viewport", () => {
    narrow = true;
    device = { ...A, tier: "B", finePointer: false, touch: true };
    const { container } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    const sources = Array.from(container.querySelectorAll("video source")).map((s) => s.getAttribute("src"));
    expect(sources).toEqual(["/video/hero/hero-short-mobile.webm", "/video/hero/hero-short-mobile.mp4"]);
  });

  it("pauses when the hero leaves the screen and plays again when it returns", () => {
    device = A;
    render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    play.mockClear();
    setVisible(false);
    expect(pause).toHaveBeenCalled();
    setVisible(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("fades the film in only once it is playing, and holds the last frame when it ends", () => {
    device = A;
    const { container } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.className).toContain("opacity-0");
    fireEvent(video, new Event("playing"));
    expect(video.className).toContain("opacity-100");
    fireEvent(video, new Event("ended"));
    expect(container.querySelector("video")).not.toBeNull();
    expect(video.className).toContain("opacity-100");
    pause.mockClear();
    setVisible(false);
    setVisible(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("falls back to the final poster when autoplay is refused", async () => {
    device = A;
    play.mockImplementationOnce(() => Promise.reject(new DOMException("blocked", "NotAllowedError")));
    const { container } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[data-hero-image]")?.getAttribute("src")).toBe(heroFilm.posters.final.webp);
  });

  it("falls back to the final poster when no source can be decoded", () => {
    device = A;
    const { container } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    const sources = container.querySelectorAll("video source");
    fireEvent(sources[sources.length - 1] as Element, new Event("error"));
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[data-hero-image]")?.getAttribute("src")).toBe(heroFilm.posters.final.webp);
  });

  it("lets the visitor pause and resume the film", () => {
    device = A;
    const { getByRole } = render(<HeroFilm film={heroFilm} />);
    setVisible(true);
    play.mockClear();
    fireEvent.click(getByRole("button", { name: "Pause film" }));
    expect(pause).toHaveBeenCalled();
    fireEvent.click(getByRole("button", { name: "Play film" }));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
