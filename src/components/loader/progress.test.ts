// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  LATE_TAKEOVER_MS,
  LOADER_BUDGET_SECONDS,
  LOADER_TIMING,
  planForLateness,
  RUNTIME_WAIT_MS,
  worstCaseSeconds,
} from "./progress";

describe("the one second intro", () => {
  it("lasts about a second and never more than 1.2 s", () => {
    expect(worstCaseSeconds()).toBeLessThanOrEqual(1.2);
    expect(worstCaseSeconds()).toBeGreaterThanOrEqual(0.8);
  });

  it("opens the window while the outline is still finishing, not after it", () => {
    expect(LOADER_TIMING.holeAt).toBeLessThanOrEqual(LOADER_TIMING.draw);
  });

  it("fades the paper plug before the window has finished growing", () => {
    expect(LOADER_TIMING.plugAt + LOADER_TIMING.plugFade).toBeLessThan(LOADER_TIMING.holeAt + LOADER_TIMING.hole);
  });

  it("finishes the window growth before the last fade of the layer", () => {
    expect(LOADER_TIMING.holeAt + LOADER_TIMING.hole).toBeLessThanOrEqual(LOADER_TIMING.rootFadeAt + 1e-9);
  });

  it("keeps the plain fade short", () => {
    expect(LOADER_TIMING.fallbackFade).toBeLessThanOrEqual(0.25);
  });

  it("lets CSS give up on a JavaScript that never arrives after about a second and a half", () => {
    expect(LOADER_TIMING.failsafeMs).toBeLessThanOrEqual(1600);
    expect(LOADER_TIMING.failsafeMs / 1000).toBeGreaterThan(worstCaseSeconds());
  });
});

describe("planForLateness", () => {
  it("plays at full speed when the runtime is there at once", () => {
    expect(planForLateness(0)).toEqual({ mode: "animated", speed: 1 });
    expect(planForLateness(-1)).toEqual({ mode: "animated", speed: 1 });
  });

  it("speeds up in proportion to how late it is, so the loader still ends inside its budget", () => {
    const plan = planForLateness(0.5);
    expect(plan.mode).toBe("animated");
    if (plan.mode === "animated") {
      expect(plan.speed).toBeGreaterThan(1);
      expect(worstCaseSeconds() / plan.speed + 0.5).toBeCloseTo(LOADER_BUDGET_SECONDS, 5);
    }
  });

  it("falls back to the static outline and fade when it is very late", () => {
    expect(planForLateness(0.9)).toEqual({ mode: "static" });
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

  it("skips the animation when JavaScript takes over later than the budget", () => {
    expect(LATE_TAKEOVER_MS).toBe(LOADER_BUDGET_SECONDS * 1000);
  });
});
