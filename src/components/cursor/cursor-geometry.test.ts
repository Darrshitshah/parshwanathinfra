import { describe, expect, it } from "vitest";
import { geometryFor, motionProfile, snapToDevicePixel } from "./cursor-geometry";
import { DEFAULT_STATE, GROW_STATE, NATIVE_STATE, type CursorState } from "./cursor-state";

const LABEL_STATE: CursorState = { kind: "label", label: "View" };
const ALL_STATES: CursorState[] = [DEFAULT_STATE, GROW_STATE, LABEL_STATE, NATIVE_STATE];

describe("geometryFor", () => {
  it("is a ring with a solid core at rest", () => {
    const g = geometryFor(DEFAULT_STATE, false);
    expect(g).toMatchObject({ ringOpacity: 1, coreOpacity: 1, disc: 0, labelOpacity: 0 });
    expect(g.ring).toBeGreaterThan(g.core);
  });

  it("grows the ring and fades the core over links", () => {
    const rest = geometryFor(DEFAULT_STATE, false);
    const grown = geometryFor(GROW_STATE, false);
    expect(grown.ring).toBeGreaterThan(rest.ring);
    expect(grown.coreOpacity).toBe(0);
    expect(grown.disc).toBe(0);
  });

  it("swaps the ring and core for the labelled disc", () => {
    const g = geometryFor(LABEL_STATE, false);
    expect(g).toMatchObject({ ringOpacity: 0, coreOpacity: 0, labelOpacity: 1 });
    expect(g.disc).toBeGreaterThan(0);
  });

  it("shrinks every visible part a little while pressed", () => {
    for (const state of [DEFAULT_STATE, GROW_STATE]) {
      expect(geometryFor(state, true).ring).toBeLessThan(geometryFor(state, false).ring);
    }
    expect(geometryFor(DEFAULT_STATE, true).core).toBeLessThan(geometryFor(DEFAULT_STATE, false).core);
    expect(geometryFor(LABEL_STATE, true).disc).toBeLessThan(geometryFor(LABEL_STATE, false).disc);
  });

  it("only uses even whole pixel sizes, so a centred box sits on the pixel grid", () => {
    for (const state of ALL_STATES) {
      for (const pressed of [false, true]) {
        const { ring, core, disc } = geometryFor(state, pressed);
        for (const size of [ring, core, disc]) {
          expect(Number.isInteger(size)).toBe(true);
          expect(size % 2).toBe(0);
        }
      }
    }
  });
});

describe("motionProfile", () => {
  it("has a lagging ring and a near-instant core in normal motion", () => {
    const m = motionProfile(false);
    expect(m.reduced).toBe(false);
    expect(m.coreFollow).toBeLessThan(m.ringFollow);
    expect(m.growEase).toContain("elastic");
  });

  it("has no lag, no spring and no duration with reduced motion", () => {
    const m = motionProfile(true);
    expect(m.reduced).toBe(true);
    expect([m.coreFollow, m.ringFollow, m.discFollow, m.grow, m.settle, m.press]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(m.growEase).toBe("none");
    expect(m.settleEase).toBe("none");
  });
});

describe("snapToDevicePixel", () => {
  it("rounds to whole device pixels", () => {
    expect(snapToDevicePixel(10.4, 1)).toBe(10);
    expect(snapToDevicePixel(10.6, 1)).toBe(11);
    expect(snapToDevicePixel(10.3, 2)).toBe(10.5);
    expect(snapToDevicePixel(10.2, 3)).toBeCloseTo(10 + 1 / 3, 10);
  });

  it("falls back to 1x for a bad ratio", () => {
    expect(snapToDevicePixel(10.6, 0)).toBe(11);
    expect(snapToDevicePixel(10.6, Number.NaN)).toBe(11);
  });
});
