import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../public/video/hero/manifest.json";
import { heroFilm, heroManifestSchema, parseHeroFilm } from "./hero-film";

const PUBLIC = join(process.cwd(), "public");
const DASHES = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clone(): Record<string, unknown> & { cuts: any; poster: any } {
  return JSON.parse(JSON.stringify(manifest));
}

describe("hero film manifest", () => {
  it("parses and exposes both cuts with webm first and both posters in avif and webp", () => {
    expect(heroFilm.cuts.short.mobile.map((s) => s.src)).toEqual(["/video/hero/hero-short-mobile.webm", "/video/hero/hero-short-mobile.mp4"]);
    expect(heroFilm.cuts.full.desktop.map((s) => s.src)).toEqual(["/video/hero/hero-desktop.webm", "/video/hero/hero-desktop.mp4"]);
    expect(heroFilm.cuts.short.durationSeconds).toBeLessThan(heroFilm.cuts.full.durationSeconds);
    expect(heroFilm.posters.start.avif).toMatch(/hero-poster-start\.avif$/);
    expect(heroFilm.posters.final.webp).toMatch(/hero-poster\.webp$/);
  });

  it("keeps the 16:9 poster ratio, so the picture reserves its space", () => {
    for (const poster of [heroFilm.posters.start, heroFilm.posters.final]) {
      expect(poster.width / poster.height).toBeCloseTo(16 / 9, 2);
    }
  });

  it("points only at files that exist in public/ with the byte sizes the manifest declares", () => {
    const entries: Array<{ src: string; bytes: number }> = [];
    const m = heroManifestSchema.parse(manifest);
    entries.push({ src: m.poster.src, bytes: m.poster.bytes }, { src: m.poster.avif.src, bytes: m.poster.avif.bytes });
    entries.push({ src: m.poster.start.src, bytes: m.poster.start.bytes }, { src: m.poster.start.avif.src, bytes: m.poster.start.avif.bytes });
    for (const cut of [m.cuts.full, m.cuts.short]) {
      for (const variant of [cut.files.desktop, cut.files.mobile]) {
        entries.push({ src: variant.webm.src, bytes: variant.webm.bytes }, { src: variant.mp4.src, bytes: variant.mp4.bytes });
      }
    }
    for (const entry of entries) {
      const file = join(PUBLIC, entry.src);
      expect(existsSync(file), entry.src).toBe(true);
      expect({ src: entry.src, bytes: statSync(file).size }).toEqual(entry);
    }
  });

  it("carries the alt text and the artist's impression flag", () => {
    expect(heroFilm.alt).toMatch(/Artist's impression/);
    expect(heroFilm.artistImpression).toBe(true);
    expect(heroFilm.alt).not.toMatch(DASHES);
  });

  it("rejects a manifest that lacks the webm encode", () => {
    const bad = clone();
    delete bad.cuts.short.files.mobile.webm;
    expect(() => parseHeroFilm(bad)).toThrow();
  });

  it("rejects a file path outside /video/hero/", () => {
    const bad = clone();
    bad.cuts.full.files.desktop.mp4.src = "https://example.com/film.mp4";
    expect(() => parseHeroFilm(bad)).toThrow();
  });

  it("rejects a missing poster and non-positive sizes", () => {
    const noPoster = clone();
    delete noPoster.poster.start;
    expect(() => parseHeroFilm(noPoster)).toThrow();
    const zero = clone();
    zero.poster.width = 0;
    expect(() => parseHeroFilm(zero)).toThrow();
  });
});

describe("hero image sequence", () => {
  it("stays unused: nothing in src/ references public/sequences/hero", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx|css)$/.test(name) && !name.endsWith("hero-film.test.ts")) {
          if (readFileSync(path, "utf8").includes("sequences/hero")) offenders.push(path);
        }
      }
    };
    walk(join(process.cwd(), "src"));
    expect(offenders).toEqual([]);
  });
});
