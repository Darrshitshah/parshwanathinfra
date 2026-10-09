// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  detectTier,
  readTierOverride,
  TIER_OVERRIDE_STORAGE_KEY,
  toDeviceInfo,
  type TierSignals,
} from "./device-tier";

const desktop: TierSignals = {
  reducedMotion: false,
  saveData: false,
  effectiveType: "4g",
  deviceMemory: 8,
  hardwareConcurrency: 10,
  webgl2: true,
  finePointer: true,
  touch: false,
};

const midRangeAndroid: TierSignals = {
  ...desktop,
  deviceMemory: 4,
  hardwareConcurrency: 8,
  finePointer: false,
  touch: true,
};

describe("detectTier", () => {
  it("gives desktops with WebGL2 Tier A, also when memory is unknown", () => {
    expect(detectTier(desktop)).toBe("A");
    expect(detectTier({ ...desktop, deviceMemory: undefined, effectiveType: undefined })).toBe("A");
  });

  it("gives the mid-range Android audience Tier B", () => {
    expect(detectTier(midRangeAndroid)).toBe("B");
  });

  it("gives high-end phones Tier A", () => {
    expect(detectTier({ ...midRangeAndroid, deviceMemory: 8, hardwareConcurrency: 8 })).toBe("A");
  });

  it("treats phones with unknown memory (iOS Safari) as Tier B", () => {
    expect(detectTier({ ...midRangeAndroid, deviceMemory: undefined, effectiveType: undefined })).toBe("B");
  });

  it("drops to Tier C for reduced motion, save-data and slow networks", () => {
    expect(detectTier({ ...desktop, reducedMotion: true })).toBe("C");
    expect(detectTier({ ...desktop, saveData: true })).toBe("C");
    expect(detectTier({ ...desktop, effectiveType: "3g" })).toBe("C");
    expect(detectTier({ ...desktop, effectiveType: "slow-2g" })).toBe("C");
  });

  it("drops to Tier B without WebGL2 or with low desktop memory", () => {
    expect(detectTier({ ...desktop, webgl2: false })).toBe("B");
    expect(detectTier({ ...desktop, deviceMemory: 2 })).toBe("B");
  });
});

describe("toDeviceInfo", () => {
  it("enables smooth scroll only for Tier A on a fine pointer", () => {
    expect(toDeviceInfo(desktop).smoothScroll).toBe(true);
    expect(toDeviceInfo(midRangeAndroid).smoothScroll).toBe(false);
    expect(toDeviceInfo(desktop, "B").smoothScroll).toBe(false);
  });

  it("applies an override but never over reduced motion", () => {
    expect(toDeviceInfo(midRangeAndroid, "A").tier).toBe("A");
    expect(toDeviceInfo({ ...desktop, reducedMotion: true }, "A").tier).toBe("C");
  });

  it("marks the result ready", () => {
    expect(toDeviceInfo(desktop).ready).toBe(true);
  });
});

describe("readTierOverride", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("reads ?tier= and remembers it for the session", () => {
    window.history.replaceState(null, "", "/?tier=B");
    expect(readTierOverride()).toBe("B");
    window.history.replaceState(null, "", "/");
    expect(readTierOverride()).toBe("B");
  });

  it("clears the override with ?tier=auto and ignores junk", () => {
    window.sessionStorage.setItem(TIER_OVERRIDE_STORAGE_KEY, "A");
    window.history.replaceState(null, "", "/?tier=auto");
    expect(readTierOverride()).toBeUndefined();
    window.history.replaceState(null, "", "/?tier=Z");
    expect(readTierOverride()).toBeUndefined();
  });
});
