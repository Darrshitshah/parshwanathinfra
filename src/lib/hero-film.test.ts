import { describe, expect, it } from "vitest";
import { heroFilm } from "@/content/hero-film";
import { pickCut, posterOnlyReason, selectHeroPlayback, type FilmEnvironment } from "./hero-film";

const phone: FilmEnvironment = { ready: true, tier: "B", reducedMotion: false, saveData: false, narrow: true };
const desktop: FilmEnvironment = { ready: true, tier: "A", reducedMotion: false, saveData: false, narrow: false };

describe("pickCut", () => {
  it("gives phones the short cut with the mobile encodes", () => {
    expect(pickCut(true)).toEqual({ cut: "short", variant: "mobile" });
  });
  it("gives wider viewports the full cut with the desktop encodes", () => {
    expect(pickCut(false)).toEqual({ cut: "full", variant: "desktop" });
  });
});

describe("selectHeroPlayback", () => {
  it("plays the short mobile files on a phone, webm before mp4", () => {
    const playback = selectHeroPlayback(heroFilm, phone);
    expect(playback.mode).toBe("film");
    if (playback.mode !== "film") return;
    expect(playback.cut).toBe("short");
    expect(playback.variant).toBe("mobile");
    expect(playback.sources.map((s) => s.src)).toEqual(["/video/hero/hero-short-mobile.webm", "/video/hero/hero-short-mobile.mp4"]);
    expect(playback.sources[0]?.type).toContain("video/webm");
    expect(playback.sources[1]?.type).toBe("video/mp4");
  });

  it("plays the full desktop files on desktop, webm before mp4", () => {
    const playback = selectHeroPlayback(heroFilm, desktop);
    expect(playback.mode).toBe("film");
    if (playback.mode !== "film") return;
    expect(playback.cut).toBe("full");
    expect(playback.sources.map((s) => s.src)).toEqual(["/video/hero/hero-desktop.webm", "/video/hero/hero-desktop.mp4"]);
  });

  it("plays on Tier B and Tier A alike, and starts from the start poster", () => {
    for (const tier of ["A", "B"] as const) {
      const playback = selectHeroPlayback(heroFilm, { ...desktop, tier });
      expect(playback.mode).toBe("film");
      expect(playback.poster).toBe("start");
    }
  });

  it("shows only the start poster before the device is known", () => {
    expect(selectHeroPlayback(heroFilm, { ...desktop, ready: false })).toEqual({ mode: "poster", poster: "start", reason: "not-ready" });
  });

  it("shows only the final poster for reduced motion, even when the tier says A", () => {
    expect(selectHeroPlayback(heroFilm, { ...desktop, reducedMotion: true })).toEqual({ mode: "poster", poster: "final", reason: "reduced-motion" });
  });

  it("shows only the final poster for Save-Data", () => {
    expect(selectHeroPlayback(heroFilm, { ...phone, saveData: true })).toEqual({ mode: "poster", poster: "final", reason: "save-data" });
  });

  it("shows only the final poster on Tier C", () => {
    expect(selectHeroPlayback(heroFilm, { ...phone, tier: "C" })).toEqual({ mode: "poster", poster: "final", reason: "tier-c" });
  });

  it("lets reduced motion win over not-ready, so the server markup can already carry the right reason", () => {
    expect(posterOnlyReason({ ready: false, tier: "C", reducedMotion: true, saveData: false })).toBe("reduced-motion");
  });
});
