// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canReveal,
  LOADER_BUDGET_SECONDS,
  planForLateness,
  RUNTIME_WAIT_MS,
  decodeImage,
  displayedPercent,
  findHeroImage,
  LOAD_WEIGHTS,
  LOADER_TIMING,
  loadFraction,
  trackLoading,
  worstCaseSeconds,
  type LoadSignal,
} from "./progress";

const none = { fonts: false, hero: false, page: false };

describe("loadFraction", () => {
  it("is 0 before anything has loaded and 1 when everything has", () => {
    expect(loadFraction(none)).toBe(0);
    expect(loadFraction({ fonts: true, hero: true, page: true })).toBeCloseTo(1);
  });

  it("weights the hero image most", () => {
    const heroOnly = loadFraction({ ...none, hero: true });
    const fontsOnly = loadFraction({ ...none, fonts: true });
    expect(heroOnly).toBeCloseTo(LOAD_WEIGHTS.hero);
    expect(heroOnly).toBeGreaterThan(fontsOnly);
  });

  it("has weights that add up to one", () => {
    expect(Object.values(LOAD_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1);
  });

  it("treats an empty weight table as fully loaded", () => {
    expect(loadFraction(none, { fonts: 0, hero: 0, page: 0 })).toBe(1);
  });
});

describe("displayedPercent", () => {
  it("never runs ahead of the line or of real loading", () => {
    expect(displayedPercent(0.9, 0.3)).toBe(30);
    expect(displayedPercent(0.2, 1)).toBe(20);
    expect(displayedPercent(1, 1)).toBe(100);
  });

  it("clamps out-of-range input", () => {
    expect(displayedPercent(2, 3)).toBe(100);
    expect(displayedPercent(-1, 0.5)).toBe(0);
  });
});

describe("canReveal", () => {
  it("waits for the line to finish", () => {
    expect(canReveal(0.7, 1, false)).toBe(false);
  });

  it("waits for loading unless the wait has been capped", () => {
    expect(canReveal(1, 0.5, false)).toBe(false);
    expect(canReveal(1, 0.5, true)).toBe(true);
    expect(canReveal(1, 1, false)).toBe(true);
  });
});

describe("the 2 second budget", () => {
  it("keeps the worst case at or under 2 s", () => {
    expect(worstCaseSeconds()).toBeLessThanOrEqual(2);
  });

  it("gives the line time to draw before the load cap forces the reveal", () => {
    expect(LOADER_TIMING.loadCap).toBeGreaterThanOrEqual(LOADER_TIMING.draw);
  });

  it("keeps the CSS failsafe well after the animated loader would have finished", () => {
    expect(LOADER_TIMING.failsafeMs / 1000).toBeGreaterThan(worstCaseSeconds());
  });
});

describe("planForLateness", () => {
  it("plays at full speed when the runtime is there at once", () => {
    expect(planForLateness(0)).toEqual({ mode: "animated", speed: 1 });
    expect(planForLateness(-1)).toEqual({ mode: "animated", speed: 1 });
  });

  it("speeds up in proportion to how late it is, so the loader still ends in 2 s", () => {
    const plan = planForLateness(0.5);
    expect(plan.mode).toBe("animated");
    if (plan.mode === "animated") {
      expect(plan.speed).toBeGreaterThan(1);
      expect(worstCaseSeconds() / plan.speed + 0.5).toBeCloseTo(LOADER_BUDGET_SECONDS, 5);
    }
  });

  it("falls back to the static outline and fade when it is very late", () => {
    expect(planForLateness(1.3)).toEqual({ mode: "static" });
    expect(planForLateness(5)).toEqual({ mode: "static" });
  });

  it("never asks for a speed-up above the cap", () => {
    for (let lateness = 0; lateness < 2.5; lateness += 0.05) {
      const plan = planForLateness(lateness);
      if (plan.mode === "animated") expect(plan.speed).toBeLessThanOrEqual(2.2);
    }
  });

  it("gives up on the runtime well before the CSS failsafe", () => {
    expect(RUNTIME_WAIT_MS).toBeLessThan(LOADER_TIMING.failsafeMs);
  });
});

describe("findHeroImage", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("finds an <img> that carries the marker itself", () => {
    document.body.innerHTML = '<img data-hero-image src="/a.webp" alt="">';
    expect(findHeroImage("[data-hero-image]")).toBeInstanceOf(HTMLImageElement);
  });

  it("finds the image inside a wrapper that carries the marker", () => {
    document.body.innerHTML = '<div data-hero-image><img src="/a.webp" alt=""></div>';
    expect(findHeroImage("[data-hero-image]")).toBeInstanceOf(HTMLImageElement);
  });

  it("returns null when there is nothing, or the selector is invalid", () => {
    expect(findHeroImage("[data-hero-image]")).toBeNull();
    expect(findHeroImage("[[")).toBeNull();
  });
});

describe("decodeImage", () => {
  it("resolves once a load event arrives, and when the image fails", async () => {
    const loaded = document.createElement("img");
    const first = decodeImage(loaded);
    loaded.dispatchEvent(new Event("load"));
    await expect(first).resolves.toBeUndefined();

    const broken = document.createElement("img");
    const second = decodeImage(broken);
    broken.dispatchEvent(new Event("error"));
    await expect(second).resolves.toBeUndefined();
  });
});

describe("trackLoading", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("reports every signal once, firing at once for signals with nothing to wait for", async () => {
    const seen: LoadSignal[] = [];
    const stop = trackLoading("[data-hero-image]", (signal) => seen.push(signal));
    await Promise.resolve();
    await Promise.resolve();
    expect(new Set(seen)).toEqual(new Set(["fonts", "hero", "page"]));
    expect(seen).toHaveLength(3);
    stop();
  });

  it("stops reporting after cleanup", async () => {
    document.body.innerHTML = '<img data-hero-image src="/a.webp" alt="">';
    const seen: LoadSignal[] = [];
    const stop = trackLoading("[data-hero-image]", (signal) => seen.push(signal));
    stop();
    const hero = document.querySelector("img");
    hero?.dispatchEvent(new Event("load"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(seen).not.toContain("hero");
  });
});
