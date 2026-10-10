import { describe, expect, it } from "vitest";
import { createNumberFormatter, formatCounter, formatIndian } from "./format";
import { clamp, clamp01, lerp, lerpLog } from "./math";

describe("formatIndian", () => {
  it("groups the Indian way", () => {
    expect(formatIndian(1565)).toBe("1,565");
    expect(formatIndian(165)).toBe("165");
    expect(formatIndian(1250000)).toBe("12,50,000");
    expect(formatIndian(0)).toBe("0");
  });

  it("supports decimals", () => {
    expect(formatIndian(1234.5, 1)).toBe("1,234.5");
    expect(formatIndian(5, 2)).toBe("5.00");
  });
});

describe("createNumberFormatter", () => {
  it("returns a reusable formatter", () => {
    const format = createNumberFormatter(0);
    expect(format(1250)).toBe("1,250");
    expect(format(99999)).toBe("99,999");
    expect(format(100000)).toBe("1,00,000");
  });

  it("rounds to the requested number of decimals", () => {
    expect(createNumberFormatter(1)(12.345)).toBe("12.3");
  });
});

describe("formatCounter", () => {
  it("always has three characters", () => {
    expect(formatCounter(0)).toBe("000");
    expect(formatCounter(7)).toBe("007");
    expect(formatCounter(42.4)).toBe("042");
    expect(formatCounter(99.6)).toBe("100");
    expect(formatCounter(100)).toBe("100");
  });

  it("clamps and survives bad input", () => {
    expect(formatCounter(250)).toBe("100");
    expect(formatCounter(-5)).toBe("000");
    expect(formatCounter(Number.NaN)).toBe("000");
    expect(formatCounter(Number.POSITIVE_INFINITY)).toBe("000");
  });
});

describe("math helpers", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
  });

  it("interpolates linearly and geometrically", () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerpLog(1, 100, 0.5)).toBeCloseTo(10);
    expect(lerpLog(4, 4, 0.7)).toBeCloseTo(4);
  });

  it("keeps the geometric ends exact and never goes non-positive", () => {
    expect(lerpLog(8, 0.5, 0)).toBeCloseTo(8);
    expect(lerpLog(8, 0.5, 1)).toBeCloseTo(0.5);
    expect(lerpLog(8, 0, 0.5)).toBeGreaterThan(0);
  });
});
